import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadCSV } from "../utils/csvLoader";

function norm(s) {
  return String(s || "").toLowerCase().trim();
}
function safeNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

/**
 * ✅ Ollama via Vite proxy (or API)
 * Option-1 (proxy):  POST /ollama/api/generate  -> http://127.0.0.1:11434/api/generate
 * Option-2 (API):    POST /api/smartbuddy       -> your backend -> ollama
 */
const USE_BACKEND_API = false;

/* ✅ LLM call: gemma2:2b */
async function callLLM({ prompt }) {
  try {
    const url = "/ollama/api/generate";
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemma2:2b",
        prompt,
        stream: false,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("LLM error:", res.status, data);
      return null;
    }
    return { text: data?.response || "" };
  } catch (e) {
    console.error("LLM fetch failed:", e);
    return null;
  }
}

function buildPrompt({ meta, factsText }) {
  return `
You are SmartBuddy (diet assistant).
Rules:
- Use ONLY foods listed in FACTS (do not invent new meal items).
- Give recipe ideas + ingredients (generic/optional) + preparation steps + portion + best timing.
- Explain WHY suggested (benefits).
- Give DOs and DON'Ts.
- Give caution notes for health conditions (general info, not medical diagnosis).

User Meta:
- BMI: ${meta?.bmiCategory || meta?.bmi || "Unknown"}
- Diet: ${meta?.dietPref || "Unknown"}
- Plan: ${meta?.planLabel || meta?.label || "Unknown"}
- Health: ${(meta?.healthConditions || []).join(", ") || "None"}
- Allergies: ${(meta?.allergies || []).join(", ") || "None"}
- Rule: calories=${meta?.recommendedCalories || "n/a"}, fat=${meta?.fatLimit || "n/a"}, fiber=${meta?.fiberMin || "n/a"}

FACTS (dataset macros):
${factsText}

Output format (use clear headings):
## Summary
## Breakfast
## Lunch
## Snack
## Dinner
## Positives
## DOs and DON'Ts
## Weekly checklist
## Safety notes
`.trim();
}

/** ✅ Extract meals from ANY plan shape */
function extractMeals(plan) {
  const day0 = plan?.days?.[0]?.meals;
  if (day0) return day0;

  if (plan?.pickedMeals) {
    const pm = plan.pickedMeals;
    return {
      breakfast: pm.breakfast ? [pm.breakfast] : [],
      lunch: pm.lunch ? [pm.lunch] : [],
      snack: pm.snack ? [pm.snack] : [],
      dinner: pm.dinner ? [pm.dinner] : [],
    };
  }

  if (plan?.meals) return plan.meals;

  return { breakfast: [], lunch: [], snack: [], dinner: [] };
}

/** ✅ Try to load last saved plan from localStorage (safe) */
function loadLastSavedPlan(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[0] || null;
  } catch {
    return null;
  }
}

/* =========================
   ✅ UI HELPERS
   ========================= */

/** Parse FACTS lines into structured meal cards */
function parseFacts(factsText = "") {
  const lines = String(factsText)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items = [];
  for (const line of lines) {
    const m = line.match(/^(BREAKFAST|LUNCH|SNACK|DINNER)\s*:\s*(.+)$/i);
    if (!m) continue;

    const meal = m[1].toUpperCase();
    const rest = m[2];
    const parts = rest.split("|").map((s) => s.trim());
    const name = parts[0] || "";

    const kcalPart = parts.find((p) => /kcal/i.test(p)) || "";
    const kcal = Number((kcalPart.match(/[\d.]+/) || [])[0]);

    const pPart = parts.find((p) => /^p\s*/i.test(p)) || "";
    const fPart = parts.find((p) => /^f\s*/i.test(p)) || "";
    const fiPart = parts.find((p) => /^fi\s*/i.test(p)) || "";

    const protein = Number((pPart.match(/[\d.]+/) || [])[0]);
    const fat = Number((fPart.match(/[\d.]+/) || [])[0]);
    const fiber = Number((fiPart.match(/[\d.]+/) || [])[0]);

    items.push({
      meal,
      name,
      kcal: Number.isFinite(kcal) ? kcal : null,
      protein: Number.isFinite(protein) ? protein : null,
      fat: Number.isFinite(fat) ? fat : null,
      fiber: Number.isFinite(fiber) ? fiber : null,
      raw: line,
    });
  }
  return items.length ? items : null;
}

/** Convert LLM markdown-ish text into simple HTML */
function llmToHtml(text = "") {
  const escapeHtml = (s) =>
    s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  const src = escapeHtml(String(text || "").trim());

  let html = src
    .replace(/^##\s+(.*)$/gm, `<h3>$1</h3>`)
    .replace(/^#\s+(.*)$/gm, `<h2>$1</h2>`);

  html = html.replace(/\*\*(.+?)\*\*/g, `<b>$1</b>`);

  const lines = html.split("\n");
  let out = [];
  let inList = false;

  for (let line of lines) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      if (!inList) {
        inList = true;
        out.push("<ul>");
      }
      out.push(`<li>${bullet[1]}</li>`);
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      if (line.trim() === "") out.push(`<div class="sb-space"></div>`);
      else out.push(`<p>${line}</p>`);
    }
  }
  if (inList) out.push("</ul>");

  return out.join("");
}

/* ✅ Your loader assets */
const LOADER_ASSETS = [
  { type: "mp4", src: "/images/robo2.mp4" },
  { type: "mp4", src: "/images/robo3.mp4" },
  { type: "mp4", src: "/images/robo4.mp4" },
  { type: "gif", src: "/images/taking-notes-kedet.gif" },
    { type: "mp4", src: "/images/robo5.mp4" },

];

const SMARTBUDDY_CSS = `
  :root{
    --text: #090909;
    --muted: rgba(0, 5, 16, 0.65);
    --panel: rgba(255,255,255,0.72);
    --border: rgba(15,23,42,0.10);
    --shadow: 0 18px 45px rgba(15, 23, 42, 0.10);
    --shadow2: 0 10px 26px rgba(15, 23, 42, 0.08);
    --r-xl: 26px;
    --r-lg: 20px;
    --r-md: 16px;
  }

  .smartbuddy-page{
    min-height: 100vh;
    padding: 42px 14px 70px;
    color: var(--text);
    background-image: url("/images/585306a4-62e9-4691-9427-5dc6c93db0d3.png");
    background-repeat: repeat-y;
    background-size: cover;
    background-position: center;
  }

  .sb-wrap{ max-width: 1100px; margin: 0 auto; }

  .sb-head{
    background: transparent;
    padding: 16px;
    max-width: 820px;
    margin: 0 auto;
  }

  .sb-title{
    margin: 0;
    font-size: clamp(26px, 3.2vw, 40px);
    font-weight: 950;
    letter-spacing: -0.02em;
    text-align: center;
  }

  .sb-sub{
    margin: 10px 0 0;
    color: var(--muted);
    text-align: center;
    font-size: 14px;
    font-weight: 800;
  }

  .sb-error{
    margin-top: 12px;
    padding: 10px 12px;
    border-radius: var(--r-md);
    border: 1px solid rgba(255,90,120,0.22);
    background: rgba(255,90,120,0.10);
    color: rgba(90,0,20,0.92);
    font-weight: 900;
  }

  .sb-card{
    background: var(--panel);
    width: min(980px, 94vw);
    margin: 0 auto;
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 16px;
    box-shadow: var(--shadow);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  .sb-cardHead{
    display:flex;
    align-items:center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 10px;
  }
  .sb-cardHead h2{
    margin: 0;
    font-size: 20px;
    font-weight: 950;
    letter-spacing: -0.01em;
  }

  .sb-pill{
    display:inline-flex;
    align-items:center;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255,199,214,0.75);
    border: 1px solid rgba(255,180,202,0.55);
    font-weight: 900;
    font-size: 10px;
  }

  .sb-meals{
    display:grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 12px;
  }
  @media (max-width: 900px){
    .sb-meals{ grid-template-columns: 1fr; }
  }

  .sb-mealCard{
    background: rgba(246, 230, 90, 0.86);
    border: 1px solid rgba(15,23,42,0.10);
    border-radius: 18px;
    padding: 12px;
    box-shadow: var(--shadow2);
  }

  .sb-mealTop{
    display:flex;
    justify-content: space-between;
    align-items:center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .sb-mealChip{
    padding: 6px 10px;
    border-radius: 999px;
    font-weight: 950;
    font-size: 12px;
    background: rgba(255,180,202,0.70);
    border: 1px solid rgba(255,180,202,0.85);
  }

  .sb-kcal{
    font-weight: 950;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(243,196,136,0.75);
    border: 1px solid rgba(243,196,136,0.9);
  }

  .sb-mealName{
    font-weight: 950;
    font-size: 14px;
    margin-bottom: 10px;
    color: rgba(0,0,0,0.86);
  }

  .sb-macros{
    display:flex;
    gap: 10px;
    flex-wrap: wrap;
    color: rgba(0,5,16,0.75);
    font-weight: 900;
    font-size: 12px;
  }
  .sb-macros span{
    background: rgba(142, 203, 255, 0.35);
    border: 1px solid rgba(142, 203, 255, 0.45);
    padding: 6px 8px;
    border-radius: 999px;
  }

  .sb-out{
    background: rgba(251, 245, 131, 0.86);
    border: 1px solid rgba(15,23,42,0.10);
    border-radius: var(--r-lg);
    padding: 14px;
    box-shadow: var(--shadow2);
    max-height: 62vh;
    overflow: auto;
    color: rgba(0,0,0,0.88);
    font-family: Cambria, Georgia, "Times New Roman", serif;
  }

  .sb-out h2{ margin: 0 0 10px; font-size: 18px; font-weight: 950; }
  .sb-out h3{
    margin: 14px 0 8px;
    font-size: 15px;
    font-weight: 950;
    padding: 8px 10px;
    border-radius: 14px;
    background: rgba(151,190,253,0.55);
    border: 1px solid rgba(15,23,42,0.08);
  }
  .sb-out p{ margin: 8px 0; line-height: 1.55; font-size: 14px; }
  .sb-out ul{ margin: 8px 0 8px 18px; padding: 0; }
  .sb-out li{ margin: 6px 0; line-height: 1.5; font-size: 14px; }
  .sb-out b{ font-weight: 950; }
  .sb-space{ height: 6px; }

  .sb-muted{ color: var(--muted); font-weight: 800; }

  .sb-actions{
    display:flex;
    gap: 12px;
    margin-top: 12px;
    flex-wrap: wrap;
  }

  .sb-btn{
    border: 1px solid rgba(15,23,42,0.12);
    background: rgba(250, 114, 114, 0.86);
    color: rgba(17,24,39,0.92);
    padding: 11px 14px;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 950;
    font-size: 13px;
    transition: transform .15s ease, box-shadow .15s ease, filter .15s ease;
    box-shadow: var(--shadow2);
  }
  .sb-btn:hover{
    transform: translateY(-2px);
    box-shadow:
      0 0 0 3px rgba(7, 225, 229, 0.18),
      0 14px 28px rgba(46, 186, 237, 0.22);
    filter: brightness(1.02);
  }
  .sb-btn:disabled{
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
  .sb-primary{ background: rgba(245, 93, 93, 0.55); }
  .sb-ghost{ background: rgba(245, 93, 93, 0.55); box-shadow: none; }

  /* ✅ Output expand */
  .sb-outCard{ transition: min-height .25s ease, transform .25s ease; }
  .sb-outCard--busy{ min-height: 520px; transform: translateY(-4px); }
  @media (max-width: 900px){ .sb-outCard--busy{ min-height: 460px; } }

  .sb-outWrap{ position: relative; min-height: 220px; }
  .sb-outCard--busy .sb-outWrap{ min-height: 420px; }

  /* ✅ Loader overlay */
  .sb-loaderOverlay{
    position: absolute;
    inset: 0;
    border-radius: var(--r-lg);
    
    display:flex;
    align-items:center;
    justify-content:center;
    z-index: 5;
   
    overflow: hidden;
  }

  .sb-loaderBox{
    width: min(620px, 92%);
    display:flex;
    align-items:center;
    gap: 14px;
    padding: 14px 16px;
   
  }

  .sb-loaderVid{
    width: 204px;
    height: 204px;
    border-radius: 18px;
    object-fit: cover;
    border: 1px solid rgba(15,23,42,0.12);
    background: rgba(255,255,255,0.7);
    flex: 0 0 auto;
  }

  .sb-loaderText{ flex: 1; min-width: 0; }
  .sb-loaderTitle{ font-weight: 950; font-size: 16px; margin-bottom: 6px; }
  .sb-loaderSub{
    font-weight: 900;
    color: rgba(0,5,16,0.70);
    font-size: 13px;
    display:flex;
    align-items:center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .sb-dots{ display:inline-flex; gap: 6px; align-items:center; }
  .sb-dots span{
    width: 7px; height: 7px; border-radius: 999px;
    background: rgba(15,23,42,0.75);
    animation: sbDot 0.9s infinite ease-in-out;
    opacity: 0.55;
  }
  .sb-dots span:nth-child(2){ animation-delay: .15s; }
  .sb-dots span:nth-child(3){ animation-delay: .30s; }

  @keyframes sbDot{
    0%,100% { transform: translateY(0); opacity: .45; }
    50% { transform: translateY(-5px); opacity: 1; }
  }

  .sb-shimmer{
    position:absolute;
    inset: 0;
    background: linear-gradient(90deg,
      rgba(255,255,255,0.00),
      rgba(255,255,255,0.25),
      rgba(255,255,255,0.00)
    );
    transform: translateX(-100%);
    animation: sbShimmer 1.2s linear infinite;
    pointer-events:none;
  }
  @keyframes sbShimmer{ to { transform: translateX(100%); } }

  /* Empty-state card */
  .sb-empty{
    max-width: 920px;
    margin: 0 auto;
    padding: 18px;
    border-radius: var(--r-xl);
    background: rgba(253, 253, 109, 0.62);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
  }
  .sb-empty h1{
    margin: 0;
    font-size: clamp(26px, 3.2vw, 40px);
    font-weight: 950;
    letter-spacing: -0.02em;
    text-align: center;
  }
  .sb-empty p{
    margin-top: 10px;
    color: var(--muted);
    text-align: center;
    font-weight: 800;
  }
  .sb-emptyActions{
    display:flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 14px;
  }
`;

export default function SmartBuddy() {
  const nav = useNavigate();
  const location = useLocation();

  const incomingPlan = location.state?.plan || location.state?.selectedPlan || null;
  const STORAGE_KEY = "bmi_plan_history";

  const [plan, setPlan] = useState(incomingPlan);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  // ✅ loader video rotation
  const [loaderIdx, setLoaderIdx] = useState(0);

  useEffect(() => {
    if (incomingPlan) {
      setPlan(incomingPlan);
      return;
    }
    const last = loadLastSavedPlan(STORAGE_KEY);
    if (last) setPlan(last);
  }, [incomingPlan]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const foodsRows = await loadCSV("/datasets/foods_dataset_final.csv");
        const foodsNorm = (foodsRows || [])
          .map((r, idx) => ({
            _row: idx,
            food_id: r.food_id ?? r.id ?? `${idx}`,
            food_name: r.food_name ?? r.name ?? "Unknown Food",
            calories_kcal: safeNum(r.calories_kcal ?? r.calories ?? r.kcal, 0),
            protein_g: safeNum(r.protein_g ?? r.protein ?? 0, 0),
            fat_g: safeNum(r.fat_g ?? r.fat ?? 0, 0),
            fiber_g: safeNum(r.fiber_g ?? r.fiber ?? 0, 0),
          }))
          .filter((f) => f.food_name);

        if (!alive) return;
        setFoods(foodsNorm);
      } catch (e) {
        setErr(e?.message || "Failed to load foods dataset");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ✅ rotate loader asset while busy
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => {
      setLoaderIdx((i) => (i + 1) % LOADER_ASSETS.length);
    }, 3200); // change every 3.2s
    return () => clearInterval(t);
  }, [busy]);

  const meals = useMemo(() => extractMeals(plan), [plan]);

  const factsText = useMemo(() => {
    const mapByName = new Map(foods.map((f) => [norm(f.food_name), f]));
    const lines = [];

    const pushItems = (mealName, arr) => {
      (arr || []).forEach((it) => {
        const nm = it?.food_name || it?.name || "";
        if (!nm) return;
        const match = mapByName.get(norm(nm)) || it;
        lines.push(
          `${mealName}: ${match.food_name} | ${Math.round(
            safeNum(match.calories_kcal)
          )} kcal | P ${safeNum(match.protein_g)}g | F ${safeNum(
            match.fat_g
          )}g | Fi ${safeNum(match.fiber_g)}g`
        );
      });
    };

    pushItems("BREAKFAST", meals.breakfast);
    pushItems("LUNCH", meals.lunch);
    pushItems("SNACK", meals.snack);
    pushItems("DINNER", meals.dinner);

    return lines.length ? lines.join("\n") : "No meal items found in this plan.";
  }, [foods, meals]);

  const factsParsed = useMemo(() => parseFacts(factsText), [factsText]);
  const outHtml = useMemo(() => (out ? llmToHtml(out) : ""), [out]);

  const loadingPhrase = useMemo(() => {
    const msgs = [
      "Picking better portions… 🍽️",
      "Balancing macros… 💪",
      "Writing easy recipes… 👨‍🍳",
      "Checking allergies & rules… ✅",
      "Finalizing plan notes… 📝",
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }, [busy, loaderIdx]);

  async function generate() {
    try {
      setBusy(true);
      setErr("");
      setOut("");

      const meta = plan?.meta || plan?.planMeta || {};
      const prompt = buildPrompt({ meta, factsText });

      const resp = await callLLM({ prompt });

      if (!resp || !resp.text) {
        setOut(
          `## SmartBuddy (Offline mode)\n\n` +
            `Ollama endpoint not reachable.\n\n` +
            `## Tips\n` +
            `- Keep meal timings consistent.\n` +
            `- Prefer steamed/boiled/grilled.\n` +
            `- For Diabetes: avoid sugary add-ons; smaller portions.\n` +
            `- For High BP: reduce oil; avoid salty sides.\n` +
            `- Add water + walking daily.\n\n` +
            `## FACTS\n${factsText}\n`
        );
        return;
      }

      setOut(resp.text);
    } catch (e) {
      setErr(e?.message || "Failed to generate explanation");
    } finally {
      setBusy(false);
    }
  }

  if (!plan) {
    return (
      <div className="smartbuddy-page">
        <div className="sb-empty">
          <h1>SmartBuddy</h1>
          <p>Select a plan to know more. SmartBuddy needs a diet plan input.</p>

          <div className="sb-emptyActions">
            <button className="sb-btn sb-primary" onClick={() => nav("/rule-diet")}>
              Go to Rule Diet
            </button>
            <button className="sb-btn sb-ghost" onClick={() => nav("/results")}>
              Open Results
            </button>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 950, marginBottom: 6, textAlign: "center" }}>
              Sample preview
            </div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{`BREAKFAST: Vegetable Upma | 272 kcal
LUNCH: Curd Rice | 438 kcal
SNACK: Fruit Salad | 284 kcal
DINNER: Vegetable Soup | 276 kcal`}</pre>
          </div>
        </div>

        <style>{SMARTBUDDY_CSS}</style>
      </div>
    );
  }

  const loaderAsset = LOADER_ASSETS[loaderIdx];

  return (
    <div className="smartbuddy-page">
      <div className="sb-wrap">
        <div className="sb-head">
          <h1 className="sb-title">SmartBuddy</h1>
          <p className="sb-sub">Click generate to get recipes + reasons + dos/don’ts.</p>
          {err ? <div className="sb-error">❌ {err}</div> : null}
        </div>

        <br />

        <div className="sb-card">
          <div className="sb-cardHead">
            <h2>Selected Plan</h2>
          </div>

          {loading ? (
            <div className="sb-muted">Loading dataset...</div>
          ) : factsParsed ? (
            <div className="sb-meals">
              {factsParsed.map((x) => (
                <div className="sb-mealCard" key={`${x.meal}-${x.name}`}>
                  <div className="sb-mealTop">
                    <span className="sb-mealChip">{x.meal}</span>
                    {x.kcal != null ? <span className="sb-kcal">{x.kcal} kcal</span> : null}
                  </div>
                  <div className="sb-mealName">{x.name}</div>
                  <div className="sb-macros">
                    <span>💪 P {x.protein ?? "-"}g</span>
                    <span>🧈 F {x.fat ?? "-"}g</span>
                    <span>🌾 Fi {x.fiber ?? "-"}g</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap" }}>{factsText}</pre>
          )}

          <div className="sb-actions">
            <button className="sb-btn sb-primary" onClick={generate} disabled={busy}>
              {busy ? "Generating..." : "Generate explanation"}
            </button>

            <button className="sb-btn sb-ghost" onClick={() => nav("/results")}>
              Back to Results
            </button>
          </div>
        </div>

        <br />

        <div className={`sb-card sb-outCard ${(busy || out) ? "sb-outCard--busy" : ""}`}>
          <div className="sb-cardHead">
            <h2>Generated Explanations</h2>
            <span className="sb-pill">AI ✨</span>
          </div>

          <div className="sb-outWrap">
            {busy ? (
              <div className="sb-loaderOverlay">
                <div className="sb-shimmer" />
                <div className="sb-loaderBox">
                  {/* ✅ MP4 loop loader */}
                  {loaderAsset?.type === "mp4" ? (
                    <video
                      className="sb-loaderVid"
                      src={loaderAsset.src}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img className="sb-loaderVid" src={loaderAsset.src} alt="loading" />
                  )}

                  <div className="sb-loaderText">
                    <div className="sb-loaderTitle">SmartBuddy is generating…</div>
                    <div className="sb-loaderSub">
                      {loadingPhrase}
                      <span className="sb-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {out ? (
              <div className="sb-out" dangerouslySetInnerHTML={{ __html: outHtml }} />
            ) : (
              <div className="sb-muted"></div>
            )}
          </div>
        </div>
      </div>

      <style>{SMARTBUDDY_CSS}</style>
    </div>
  );
}
