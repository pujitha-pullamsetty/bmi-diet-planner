import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loadCSV } from "../utils/csvLoader";

const MEALS = ["breakfast", "lunch", "snack", "dinner"];
const LS_HISTORY_KEY = "bmi_plan_history";

function norm(s) {
  return String(s || "").toLowerCase().trim();
}
function safeNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}
function toMealKey(mealType) {
  const s = norm(mealType);
  if (s.includes("break")) return "breakfast";
  if (s.includes("lunch")) return "lunch";
  if (s.includes("dinner")) return "dinner";
  if (s.includes("snack")) return "snack";
  return s || "other";
}
function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

/* ✅ Seeded random */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickRandomSeeded(arr, k, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, k);
}

/* ---------- localStorage helpers ---------- */
function safeParse(json, fallback) {
  try {
    return JSON.parse(json) ?? fallback;
  } catch {
    return fallback;
  }
}
function uid() {
  return "plan_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}
function normalizeMeals(meals) {
  return {
    breakfast: Array.isArray(meals?.breakfast) ? meals.breakfast : [],
    lunch: Array.isArray(meals?.lunch) ? meals.lunch : [],
    snack: Array.isArray(meals?.snack) ? meals.snack : [],
    dinner: Array.isArray(meals?.dinner) ? meals.dinner : [],
  };
}
function savePlanToHistory({ meals, meta, daysCount = 1 }) {
  const history = safeParse(localStorage.getItem(LS_HISTORY_KEY), []);

  const days = Array.isArray(meals?.days)
    ? meals.days.map((d, idx) => ({
        dayIndex: d.dayIndex || idx + 1,
        meals: normalizeMeals(d.meals || d),
      }))
    : Array.from({ length: daysCount }, (_, i) => ({
        dayIndex: i + 1,
        meals: normalizeMeals(meals),
      }));

  const newPlan = {
    id: uid(),
    createdAt: new Date().toISOString(),
    meta: meta || {},
    days,
  };
  history.unshift(newPlan);
  localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
  return newPlan;
}

/* ---------- Nutrition rules ---------- */
function parseCaloriesRange(rangeStr) {
  if (!rangeStr || typeof rangeStr !== "string")
    return { min: 0, max: Infinity };
  const parts = rangeStr
    .split("-")
    .map((s) => String(s).trim())
    .filter(Boolean);
  const min = Number(parts[0] ?? 0) || 0;
  const max = Number(parts[1] ?? Infinity) || Infinity;
  return { min, max };
}
function parseLimit(limitStr) {
  if (limitStr == null) return Infinity;
  const s = String(limitStr).trim();
  const num = Number(s.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(num)) return Infinity;
  return num;
}
function matchesBmiRule(food, rule) {
  if (!rule) return true;
  const cal = safeNum(food.calories_kcal, 0);
  const fat = safeNum(food.fat_g, 0);
  const fiber = safeNum(food.fiber_g, 0);

  const { max } = parseCaloriesRange(rule.recommended_calories);
  const fatLimit = parseLimit(rule.fat_limit_g);
  const fiberMin = safeNum(rule.fiber_min_g, 0);

  const calOk = cal >= 50 && cal <= Math.max(650, max / 2.5);
  const fatOk = fat <= fatLimit || fatLimit === Infinity;
  const fiberOk = fiber >= Math.max(0, fiberMin / 4);

  return calOk && fatOk && fiberOk;
}

/* ---------- Snack detection ---------- */
function isSnackLikeName(foodName) {
  const n = norm(foodName);
  const keys = [
    "fruit",
    "nuts",
    "seed",
    "sprouts",
    "yogurt",
    "curd",
    "buttermilk",
    "salad",
    "soup",
    "smoothie",
    "apple",
    "banana",
    "orange",
    "guava",
    "papaya",
    "pomegranate",
    "almond",
    "cashew",
    "walnut",
    "pistachio",
    "chia",
    "flax",
    "sunflower",
    "pumpkin",
    "dates",
    "raisins",
    "fig",
    "makhana",
    "roasted chana",
    "lemon water",
    "green tea",
    "sprout",
    "dry fruit",
  ];
  return keys.some((k) => n.includes(k));
}

/* ✅ Snack catalog (ensures variety even if dataset missing snack rows) */
const SNACK_CATALOG = [
  // Fruits
  "Apple",
  "Banana",
  "Orange",
  "Guava",
  "Papaya",
  "Pomegranate",
  "Watermelon",
  "Grapes",
  "Mango",
  "Pineapple",
  "Muskmelon",

  // Dry fruits
  "Almonds",
  "Cashews",
  "Walnuts",
  "Pistachios",
  "Dates",
  "Raisins",
  "Figs",

  // Seeds / drinks
  "Chia seeds",
  "Chia seeds water",
  "Chia seeds milkshake",
  "Flax seeds",
  "Sunflower seeds",
  "Pumpkin seeds",

  // Light snacks
  "Sprouts salad",
  "Fruit salad",
  "Buttermilk",
  "Curd",
  "Yogurt",
  "Cucumber salad",
  "Moong sprouts",
  "Roasted chana",
  "Makhana",
  "Lemon water",
  "Green tea",
  "Vegetable soup",
];

function makeSnackFromCatalog(name) {
  return {
    _row: "catalog_" + norm(name),
    food_id: "catalog_" + norm(name),
    food_name: name,
    diet_type: "Veg",
    meal_type: "snack",
    calories_kcal: 120,
    protein_g: 3,
    fat_g: 4,
    fiber_g: 4,
    _isCatalog: true,
  };
}

/* ---------- Egg catalogs by meal ---------- */
const EGG_CATALOG_BY_MEAL = {
  breakfast: [
    "Boiled egg",
    "Egg omelette",
    "Egg bhurji",
    "Scrambled egg",
    "Egg sandwich",
    "Egg dosa",
  ],
  snack: ["Boiled egg", "Egg salad", "Egg wrap"],
  lunch: ["Egg curry", "Egg fried rice", "Egg pulao", "Egg biryani"],
  dinner: ["Egg curry", "Egg bhurji", "Egg biryani"],
};

function hasEggFood(food) {
  const name = norm(food.food_name);
  const dt = norm(food.diet_type);
  return (
    name.includes("egg") ||
    ["omelette", "omelet", "bhurji", "scramble"].some((k) =>
      name.includes(k)
    ) ||
    dt.includes("egg") ||
    dt.includes("eggetarian")
  );
}

function eggAllergyOn(prefs) {
  return (prefs.allergies || []).map(norm).includes("egg");
}

function makeEggItem(name, meal) {
  return {
    _row: `eggcat_${meal}_${norm(name)}`,
    food_id: `eggcat_${meal}_${norm(name)}`,
    food_name: name,
    diet_type: "Eggetarian",
    meal_type: meal,
    calories_kcal: 200,
    protein_g: 12,
    fat_g: 12,
    fiber_g: 1,
    _isEggCatalog: true,
  };
}

// backup breakfast replacement when Egg allergy ON
const BREAKFAST_CATALOG = [
  "Idli",
  "Dosa",
  "Upma",
  "Poha",
  "Oats porridge",
  "Ragi porridge",
  "Vegetable oats",
  "Moong dal cheela",
  "Besan chilla",
  "Sprouts chat",
  "Fruit bowl",
  "Yogurt with fruits",
];

function makeBreakfastFromCatalog(name) {
  return {
    _row: "bfcat_" + norm(name),
    food_id: "bfcat_" + norm(name),
    food_name: name,
    diet_type: "Veg",
    meal_type: "breakfast",
    calories_kcal: 220,
    protein_g: 9,
    fat_g: 6,
    fiber_g: 5,
    _isBreakfastCatalog: true,
  };
}

/* ---------- Diet filtering: Veg / Non-Veg / Eggetarian / Vegan ---------- */
function dietMatches(food, dietPref) {
  const dt = norm(food.diet_type);
  const name = norm(food.food_name);

  const isNonVeg =
    dt.includes("non") ||
    dt.includes("nonveg") ||
    dt.includes("non-veg") ||
    ["chicken", "mutton", "fish", "prawn", "meat", "beef", "pork"].some((k) =>
      name.includes(k)
    );

  const hasEgg =
    dt.includes("egg") || dt.includes("eggetarian") || name.includes("egg");

  const hasDairy =
    dt.includes("dairy") ||
    ["milk", "curd", "paneer", "cheese", "yogurt", "butter", "ghee"].some((k) =>
      name.includes(k)
    );

  // Vegan: only plant-based
  if (dietPref === "Vegan") {
    if (isNonVeg || hasEgg || hasDairy) return false;
    return true;
  }

  // Eggetarian: egg allowed, but no meat/fish
  if (dietPref === "Eggetarian") {
    if (isNonVeg) return false;
    return true;
  }

  // Veg: no meat and no egg (dairy ok)
  if (dietPref === "Veg") {
    if (isNonVeg || hasEgg) return false;
    return true;
  }

  // Non-Veg: allow everything
  if (dietPref === "Non-Veg") return true;

  return true;
}

/* ---------- User restrictions ---------- */
function passesUserRestrictions(food, prefs) {
  const name = norm(food.food_name);

  const dislikes = (prefs.dislikes || "")
    .split(",")
    .map(norm)
    .filter(Boolean);
  for (const d of dislikes) if (d && name.includes(d)) return false;

  const allergies = (prefs.allergies || []).map(norm).filter(Boolean);
  for (const a of allergies) if (a && name.includes(a)) return false;

  const cal = safeNum(food.calories_kcal, 0);
  const fat = safeNum(food.fat_g, 0);

  if ((prefs.healthConditions || []).includes("Diabetes")) {
    if (cal > 380) return false;
  }
  if ((prefs.healthConditions || []).includes("High BP")) {
    if (fat > 16) return false;
  }

  return true;
}

function scoreFood(food, planMode, prefs) {
  const protein = safeNum(food.protein_g, 0);
  const fiber = safeNum(food.fiber_g, 0);
  const fat = safeNum(food.fat_g, 0);
  const cal = safeNum(food.calories_kcal, 0);

  let score = 0;

  // health-aware
  if ((prefs.healthConditions || []).includes("Diabetes"))
    score += cal <= 260 ? 2 : -0.5;
  if ((prefs.healthConditions || []).includes("High BP"))
    score += fat <= 8 ? 2 : -0.5;

  // mode
  if (planMode === "highProtein") score += protein * 1.2;
  else if (planMode === "highFiber") score += fiber * 1.3;
  else if (planMode === "lowFat") score += Math.max(0, 16 - fat);
  else score += Math.max(0, 420 - cal) / 60;

  // snack boost
  if (isSnackLikeName(food.food_name) || food._isCatalog) score += 3;

  // diabetes: reduce sweet dry fruits a bit
  if ((prefs.healthConditions || []).includes("Diabetes")) {
    const n = norm(food.food_name);
    if (n.includes("dates") || n.includes("raisins")) score -= 2;
  }

  // ✅ Eggetarian: egg items top lo raavali (if Egg allergy OFF)
  if (prefs.dietPref === "Eggetarian" && !eggAllergyOn(prefs) && hasEggFood(food)) {
    score += 8;
  }

  // ✅ Egg allergy ON: egg items strongly down
  if (eggAllergyOn(prefs) && hasEggFood(food)) {
    score -= 50;
  }

  return score;
}

/* ✅ OPTIONAL LLM assist (calls /api/llm). If not available -> fallback */
async function callLLMChoose({ prefs, bmiRule, candidatesByMeal }) {
  try {
    const compact = {};
    for (const [meal, arr] of Object.entries(candidatesByMeal)) {
      compact[meal] = arr.slice(0, 12).map((x) => ({
        name: x.food_name,
        kcal: Math.round(safeNum(x.calories_kcal)),
        p: safeNum(x.protein_g),
        f: safeNum(x.fat_g),
        fi: safeNum(x.fiber_g),
      }));
    }

    const prompt = `
You are SmartBuddy Diet Planner (gemma 2:2b).
Pick 4 best options for each meal from provided candidates ONLY.
Goal: match user preferences + BMI rule, keep variety, prefer snack-like items for SNACK.

User:
- BMI: ${prefs.bmiCategory}
- Diet: ${prefs.dietPref}
- Health: ${(prefs.healthConditions || []).join(", ") || "None"}
- Allergies: ${(prefs.allergies || []).join(", ") || "None"}
- Dislikes: ${prefs.dislikes || "None"}

BMI Rule:
- Calories: ${bmiRule?.recommended_calories || "n/a"}
- Fat limit: ${bmiRule?.fat_limit_g || "n/a"}
- Fiber min: ${bmiRule?.fiber_min_g || "n/a"}

Candidates JSON:
${JSON.stringify(compact, null, 2)}

Return STRICT JSON only:
{
 "breakfast":[ "exact name", ... ],
 "lunch":[...],
 "snack":[...],
 "dinner":[...]
}
`.trim();

    const res = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.text || data?.message || "";

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return null;

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    return parsed;
  } catch {
    return null;
  }
}

export default function RuleDiet() {
  const nav = useNavigate();
  const location = useLocation();

  const bmiCategoryFromState =
    location.state?.bmiCategory || location.state?.bmi_category || "Normal";

  const [foods, setFoods] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyGen, setBusyGen] = useState(false);
  const [err, setErr] = useState("");

  const [prefs, setPrefs] = useState({
    bmiCategory: bmiCategoryFromState,
    dietPref: "Veg",
    allergies: [],
    healthConditions: [],
    taste: "Any",
    dislikes: "",
  });

  // ✅ When coming again from BMI page, update dropdown automatically
  useEffect(() => {
    const incoming = location.state?.bmiCategory || location.state?.bmi_category;
    if (incoming) {
      setPrefs((p) => ({ ...p, bmiCategory: incoming }));
    }
  }, [location.state]);

  const [prefsSubmitted, setPrefsSubmitted] = useState(false);

  const [seed, setSeed] = useState(1);
  const [activePlanId, setActivePlanId] = useState("");
  const [generatedPlans, setGeneratedPlans] = useState({});
  const [picked, setPicked] = useState({
    breakfast: null,
    lunch: null,
    snack: null,
    dinner: null,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const [foodsRows, rulesRows] = await Promise.all([
          loadCSV("/datasets/foods_dataset_final.csv"),
          loadCSV("/datasets/nutrition_rules_final.csv"),
        ]);

        if (!foodsRows?.length)
          throw new Error(
            "foods_dataset_final.csv not loaded (empty/404). public/datasets/."
          );
        if (!rulesRows?.length)
          throw new Error(
            "nutrition_rules_final.csv not loaded  (empty/404). public/datasets/."
          );
        if (!alive) return;

        const foodsNorm = foodsRows
          .map((r, idx) => ({
            _row: idx,
            food_id: r.food_id ?? r.id ?? `${idx}`,
            food_name: r.food_name ?? r.name ?? "Unknown Food",
            diet_type: r.diet_type ?? r.diet ?? "",
            meal_type: r.meal_type ?? r.meal ?? "",
            calories_kcal: safeNum(r.calories_kcal ?? r.calories ?? r.kcal, 0),
            protein_g: safeNum(r.protein_g ?? r.protein ?? 0, 0),
            fat_g: safeNum(r.fat_g ?? r.fat ?? 0, 0),
            fiber_g: safeNum(r.fiber_g ?? r.fiber ?? 0, 0),
          }))
          .filter((f) => f.food_name && f.calories_kcal > 0);

        const rulesNorm = rulesRows.map((r) => ({
          bmi_category: r.bmi_category ?? r.category ?? "",
          recommended_calories: r.recommended_calories ?? r.calories ?? "",
          fat_limit_g: r.fat_limit_g ?? r.fat_limit ?? "",
          fiber_min_g: r.fiber_min_g ?? r.fiber_min ?? 0,
          protein_focus: r.protein_focus ?? r.protein ?? "",
        }));

        setFoods(foodsNorm);
        setRules(rulesNorm);
      } catch (e) {
        setErr(e?.message || "Failed to load datasets");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const bmiRule = useMemo(() => {
    return (
      rules.find((r) => norm(r.bmi_category) === norm(prefs.bmiCategory)) || null
    );
  }, [rules, prefs.bmiCategory]);

  // ✅ Plans list (generic)
  const plansList = useMemo(() => {
    return [
      { id: "balanced", label: "Balanced", mode: "balanced" },
      { id: "highProtein", label: "High Protein", mode: "highProtein" },
      { id: "highFiber", label: "High Fiber", mode: "highFiber" },
      { id: "lowFat", label: "Low Fat", mode: "lowFat" },
    ];
  }, []);

  function getBaseFilteredFoods() {
    return foods
      .filter((f) => dietMatches(f, prefs.dietPref))
      .filter((f) => matchesBmiRule(f, bmiRule))
      .filter((f) => passesUserRestrictions(f, prefs));
  }

  function buildByMealPools(base) {
    const mainWords = [
      "biryani",
      "fried rice",
      "noodles",
      "gravy",
      "curry",
      "meals",
      "thali",
    ];

    const breakfastPool = uniqBy(
      base
        .filter((f) => toMealKey(f.meal_type) === "breakfast")
        .filter((f) => !mainWords.some((k) => norm(f.food_name).includes(k))),
      (x) => norm(x.food_name)
    );

    const lunchPool = uniqBy(
      base.filter((f) => toMealKey(f.meal_type) === "lunch"),
      (x) => norm(x.food_name)
    );

    const dinnerPool = uniqBy(
      base.filter((f) => toMealKey(f.meal_type) === "dinner"),
      (x) => norm(x.food_name)
    );

    // snack pools
    const snackCatalogFoods = SNACK_CATALOG.map(makeSnackFromCatalog);
    const snackDataset = base.filter((f) => toMealKey(f.meal_type) === "snack");
    const snackNames = base.filter((f) => isSnackLikeName(f.food_name));

    const snackLight = base
      .filter((f) => safeNum(f.calories_kcal) <= 260)
      .filter((f) => !["lunch", "dinner"].includes(toMealKey(f.meal_type)))
      .filter((f) => {
        const n = norm(f.food_name);
        const main = [
          "rice",
          "biryani",
          "roti",
          "chapati",
          "paratha",
          "curry",
          "fried",
          "noodles",
          "meals",
          "thali",
        ];
        return !main.some((k) => n.includes(k));
      });

    const snackPool = uniqBy(
      [...snackCatalogFoods, ...snackDataset, ...snackNames, ...snackLight],
      (x) => norm(x.food_name)
    );

    // ✅ Inject egg catalog (unless egg allergy ON)
    const allowEgg =
      (prefs.dietPref === "Eggetarian" || prefs.dietPref === "Non-Veg") &&
      !eggAllergyOn(prefs);

    const eggBreakfast = allowEgg
      ? (EGG_CATALOG_BY_MEAL.breakfast || []).map((n) =>
          makeEggItem(n, "breakfast")
        )
      : [];
    const eggSnack = allowEgg
      ? (EGG_CATALOG_BY_MEAL.snack || []).map((n) => makeEggItem(n, "snack"))
      : [];
    const eggLunch = allowEgg
      ? (EGG_CATALOG_BY_MEAL.lunch || []).map((n) => makeEggItem(n, "lunch"))
      : [];
    const eggDinner = allowEgg
      ? (EGG_CATALOG_BY_MEAL.dinner || []).map((n) => makeEggItem(n, "dinner"))
      : [];

    // Egg allergy ON -> breakfast replacements
    const bfReplace = eggAllergyOn(prefs)
      ? BREAKFAST_CATALOG.map(makeBreakfastFromCatalog)
      : [];

    const breakfastFinal = uniqBy(
      [...eggBreakfast, ...bfReplace, ...breakfastPool],
      (x) => norm(x.food_name)
    );
    const snackFinal = uniqBy(
      [...eggSnack, ...snackPool],
      (x) => norm(x.food_name)
    );
    const lunchFinal = uniqBy([...eggLunch, ...lunchPool], (x) =>
      norm(x.food_name)
    );
    const dinnerFinal = uniqBy([...eggDinner, ...dinnerPool], (x) =>
      norm(x.food_name)
    );

    return {
      breakfast: breakfastFinal,
      snack: snackFinal,
      lunch: lunchFinal,
      dinner: dinnerFinal,
    };
  }

  function getEggQuotaForMeal(prefs, mealKey) {
    if (eggAllergyOn(prefs)) return { eggMin: 0, eggMax: 0, total: 4 };

    if (prefs.dietPref === "Vegan" || prefs.dietPref === "Veg")
      return { eggMin: 0, eggMax: 0, total: 4 };

    if (prefs.dietPref === "Eggetarian") {
      if (mealKey === "breakfast" || mealKey === "snack")
        return { eggMin: 2, eggMax: 3, total: 4 };
      return { eggMin: 2, eggMax: 2, total: 4 };
    }

    if (prefs.dietPref === "Non-Veg") {
      if (mealKey === "snack") return { eggMin: 0, eggMax: 0, total: 4 };
      return { eggMin: 0, eggMax: 1, total: 4 };
    }

    return { eggMin: 0, eggMax: 0, total: 4 };
  }

  function pickMealOptionsWithEggRules({ ranked, rng, quota }) {
    const total = quota.total ?? 4;

    const eggItems = ranked.filter((x) => hasEggFood(x));
    const nonEggItems = ranked.filter((x) => !hasEggFood(x));

    const eggCount = Math.max(
      0,
      Math.min(
        total,
        Math.floor(quota.eggMin + rng() * (quota.eggMax - quota.eggMin + 1))
      )
    );

    const eggsPicked = pickRandomSeeded(eggItems.slice(0, 80), eggCount, rng);
    const nonEggPicked = pickRandomSeeded(
      nonEggItems.slice(0, 80),
      Math.max(0, total - eggsPicked.length),
      rng
    );

    return uniqBy([...eggsPicked, ...nonEggPicked], (x) => x.food_id).slice(
      0,
      total
    );
  }

  async function generatePlansSmart(nextSeed) {
    setBusyGen(true);
    setErr("");

    try {
      const rng = mulberry32(nextSeed);
      const plans = {};

      for (const plan of plansList) {
        const base = getBaseFilteredFoods();
        const byMeal = buildByMealPools(base);

        // ranked candidates
        const candidates = {};
        for (const m of MEALS) {
          candidates[m] = [...(byMeal[m] || [])].sort(
            (a, b) => scoreFood(b, plan.mode, prefs) - scoreFood(a, plan.mode, prefs)
          );
        }

        // ✅ LLM assist (optional)
        const llmPickedNames = await callLLMChoose({
          prefs,
          bmiRule,
          candidatesByMeal: candidates,
        });

        const mealsOut = {};

        // Non-veg strict egg budget for whole plan
        let nonVegEggBudget = 0;
        if (prefs.dietPref === "Non-Veg" && !eggAllergyOn(prefs)) {
          nonVegEggBudget = rng() < 0.5 ? 1 : 2; // only 1 or 2 egg options total
        }

        for (const m of MEALS) {
          const ranked = candidates[m] || [];
          if (!ranked.length) {
            mealsOut[m] = [];
            continue;
          }

          // If LLM chose, map names -> items (still filtered by egg budget below)
          if (llmPickedNames?.[m]?.length) {
            const wanted = llmPickedNames[m].map(norm);
            const chosen = [];
            for (const w of wanted) {
              const hit = ranked.find((x) => norm(x.food_name) === w);
              if (hit) chosen.push(hit);
            }
            const rest = ranked.filter(
              (x) => !chosen.some((c) => c.food_id === x.food_id)
            );
            let merged = uniqBy(
              [...chosen, ...pickRandomSeeded(rest.slice(0, 40), 6, rng)],
              (x) => x.food_id
            ).slice(0, 4);

            // enforce non-veg budget
            if (prefs.dietPref === "Non-Veg" && !eggAllergyOn(prefs)) {
              const eggs = merged.filter(hasEggFood);
              if (eggs.length > 0) {
                if (nonVegEggBudget <= 0) {
                  merged = merged.filter((x) => !hasEggFood(x));
                  const extra = ranked.filter((x) => !hasEggFood(x));
                  const need = 4 - merged.length;
                  merged = uniqBy(
                    [...merged, ...pickRandomSeeded(extra.slice(0, 80), need, rng)],
                    (x) => x.food_id
                  ).slice(0, 4);
                } else {
                  nonVegEggBudget -= 1;
                  const keepEgg = eggs.slice(0, 1);
                  const nonEgg = merged.filter((x) => !hasEggFood(x));
                  merged = uniqBy([...keepEgg, ...nonEgg], (x) => x.food_id).slice(
                    0,
                    4
                  );
                }
              }
            }

            mealsOut[m] = merged;
            continue;
          }

          // fallback selection with egg rules
          let chosen = pickMealOptionsWithEggRules({
            mealKey: m,
            ranked,
            rng,
            prefs,
            quota: getEggQuotaForMeal(prefs, m),
          });

          // enforce non-veg egg budget strictly across whole plan
          if (prefs.dietPref === "Non-Veg" && !eggAllergyOn(prefs)) {
            const eggs = chosen.filter(hasEggFood);
            if (eggs.length > 0) {
              if (nonVegEggBudget <= 0) {
                chosen = chosen.filter((x) => !hasEggFood(x));
                const extra = ranked.filter((x) => !hasEggFood(x));
                const need = 4 - chosen.length;
                chosen = uniqBy(
                  [...chosen, ...pickRandomSeeded(extra.slice(0, 80), need, rng)],
                  (x) => x.food_id
                ).slice(0, 4);
              } else {
                nonVegEggBudget -= 1;
                const keepEgg = eggs.slice(0, 1);
                const nonEgg = chosen.filter((x) => !hasEggFood(x));
                chosen = uniqBy([...keepEgg, ...nonEgg], (x) => x.food_id).slice(
                  0,
                  4
                );
              }
            }
          }

          mealsOut[m] = chosen;
        }

        plans[plan.id] = {
          meta: plan,
          meals: mealsOut,
          stats: {
            count:
              (mealsOut.breakfast?.length || 0) +
              (mealsOut.lunch?.length || 0) +
              (mealsOut.snack?.length || 0) +
              (mealsOut.dinner?.length || 0),
            baseCount: base.length,
          },
        };
      }

      setGeneratedPlans(plans);
      const first = plansList[0]?.id || "";
      setActivePlanId(first);
      setPicked({ breakfast: null, lunch: null, snack: null, dinner: null });
    } catch (e) {
      setErr(e?.message || "Failed to generate plans");
    } finally {
      setBusyGen(false);
    }
  }

  function onSubmitPrefs(e) {
    e.preventDefault();
    setPrefsSubmitted(true);
    const next = Date.now();
    setSeed(next);
    generatePlansSmart(next);
  }

  function regenerateAllPlans() {
    const next = Date.now();
    setSeed(next);
    generatePlansSmart(next);
  }

  // ✅ Auto refresh when diet/allergies changes (egg allergy ON -> replacement happens instantly)
  useEffect(() => {
    if (!prefsSubmitted) return;
    const next = Date.now();
    setSeed(next);
    generatePlansSmart(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs.allergies, prefs.dietPref]);

  const activePlan = generatedPlans[activePlanId] || null;

  async function refreshOnlyMeal(mealKey) {
    if (!activePlan) return;

    setBusyGen(true);
    setErr("");

    try {
      const nextSeed = Date.now();
      const rng = mulberry32(nextSeed);

      const planMode = activePlan?.meta?.mode || "balanced";
      const base = getBaseFilteredFoods();
      const byMeal = buildByMealPools(base);

      const ranked = [...(byMeal[mealKey] || [])].sort(
        (a, b) => scoreFood(b, planMode, prefs) - scoreFood(a, planMode, prefs)
      );

      let newOpts = [];
      if (!ranked.length) {
        newOpts = [];
      } else {
        newOpts = pickMealOptionsWithEggRules({
          mealKey,
          ranked,
          rng,
          prefs,
          quota: getEggQuotaForMeal(prefs, mealKey),
        });
      }

      setGeneratedPlans((prev) => {
        const updated = { ...prev };
        const planId = activePlanId;
        const planObj = updated[planId];
        if (!planObj) return prev;

        updated[planId] = {
          ...planObj,
          meals: { ...planObj.meals, [mealKey]: newOpts },
        };
        return updated;
      });

      setPicked((p) => ({ ...p, [mealKey]: null }));
      setSeed(nextSeed);
    } catch (e) {
      setErr(e?.message || "Failed to refresh meal");
    } finally {
      setBusyGen(false);
    }
  }

  const canFollow = useMemo(
    () => picked.breakfast && picked.lunch && picked.dinner,
    [picked]
  );

  function followPlan() {
    if (!activePlan) return;

    const selectedMeals = {
      breakfast: picked.breakfast ? [picked.breakfast] : [],
      lunch: picked.lunch ? [picked.lunch] : [],
      snack: picked.snack ? [picked.snack] : [],
      dinner: picked.dinner ? [picked.dinner] : [],
    };

    const meta = {
      bmiCategory: prefs.bmiCategory,
      dietPref: prefs.dietPref,
      planLabel: activePlan?.meta?.label || "",
      planId: activePlanId,
      seed,
      recommendedCalories: bmiRule?.recommended_calories || "",
      fatLimit: bmiRule?.fat_limit_g || "",
      fiberMin: bmiRule?.fiber_min_g || "",
      healthConditions: prefs.healthConditions || [],
      allergies: prefs.allergies || [],
    };

    const savedPlan = savePlanToHistory({
      meals: selectedMeals,
      meta,
      daysCount: 1,
    });
    nav("/results", { state: { justSavedId: savedPlan.id } });
  }

  if (loading) {
    return (
      <div className="rule-diet">
        <div className="container">
          <h1 className="title">Rule-Based Diet Plans</h1>
          <p className="subtitle">Loading datasets…</p>
          <div className="card" style={{ marginTop: 18 }}>
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rule-diet">
      {busyGen && (
        <div className="sb-overlay">
          <div className="sb-box">
            <div className="sb-spinner" />
            <div className="sb-title">Customizing with SmartBuddy…</div>
            <div className="sb-sub">
              Rule-based logic + LLM intelligence (if connected)
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <header className="hero">
          <h1 className="title">Rule-Based Diet Plans</h1>
          <p className="subtitle">
            Preferences → Generate diet plans using{" "}
            <b>Rule logic + SmartBuddy (LLM)</b>.
          </p>

          

          {err ? <p className="error">{err}</p> : null}
        </header>

        <div className="card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Your Preferences</h2>
              <p className="muted">Fill once → plans are customized.</p>
            </div>
          </div>

          <form className="pref-grid" onSubmit={onSubmitPrefs}>
            <div className="pref-item">
              <label className="muted small">BMI Category</label>
              <select
                className="select"
                value={prefs.bmiCategory}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, bmiCategory: e.target.value }))
                }
              >
                <option>Underweight</option>
                <option>Normal</option>
                <option>Overweight</option>
                <option>Obese</option>
              </select>
            </div>

            <div className="pref-item">
              <label className="muted small">Diet Preference</label>
              <select
                className="select"
                value={prefs.dietPref}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, dietPref: e.target.value }))
                }
              >
                <option value="Veg">Veg</option>
                <option value="Non-Veg">Non-Veg</option>
                <option value="Eggetarian">Eggetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>

            <div className="pref-item">
              <label className="muted small">Health conditions</label>
              <div className="chips">
                {["Diabetes", "High BP", "Thyroid"].map((c) => (
                  <button
                    type="button"
                    key={c}
                    className={`chip ${
                      prefs.healthConditions.includes(c) ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPrefs((p) => ({
                        ...p,
                        healthConditions: p.healthConditions.includes(c)
                          ? p.healthConditions.filter((x) => x !== c)
                          : [...p.healthConditions, c],
                      }));
                    }}
                  >
                    {c}
                  </button>
                ))}
                <button
                  type="button"
                  className={`chip ${
                    prefs.healthConditions.length === 0 ? "active" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPrefs((p) => ({ ...p, healthConditions: [] }));
                  }}
                >
                  None
                </button>
              </div>
            </div>

            <div className="pref-item">
              <label className="muted small">Allergies</label>
              <div className="chips">
                {["Peanut", "Milk", "Egg", "Wheat", "Soy"].map((a) => (
                  <button
                    type="button"
                    key={a}
                    className={`chip ${prefs.allergies.includes(a) ? "active" : ""}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setPrefs((p) => ({
                        ...p,
                        allergies: p.allergies.includes(a)
                          ? p.allergies.filter((x) => x !== a)
                          : [...p.allergies, a],
                      }));
                    }}
                  >
                    {a}
                  </button>
                ))}
                <button
                  type="button"
                  className={`chip ${prefs.allergies.length === 0 ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPrefs((p) => ({ ...p, allergies: [] }));
                  }}
                >
                  None
                </button>
              </div>
              
            </div>

            <div className="pref-item">
              <label className="muted small">Dislikes (comma keywords)</label>
              <input
                className="input1"
                value={prefs.dislikes}
                onChange={(e) => setPrefs((p) => ({ ...p, dislikes: e.target.value }))}
                placeholder="Example: rice, fried, sweet"
              />
            </div>

            <div className="pref-actions">
              <button className="btn-primary" type="submit" disabled={busyGen}>
                {busyGen ? "Customizing..." : "Generate Plans"}
              </button>

              {prefsSubmitted ? (
                <button
                  className="btn-outline"
                  type="button"
                  onClick={regenerateAllPlans}
                  disabled={busyGen}
                >
                  Refresh (New Options)
                </button>
              ) : null}
            </div>
          </form>
        </div>

        {prefsSubmitted ? (
          <>
            <div className="plans-row">
              <h2 className="section-title">Pick a Diet Plan</h2>
              <button
                className="btn-outline"
                onClick={regenerateAllPlans}
                type="button"
                disabled={busyGen}
              >
                Refresh all plans
              </button>
            </div>

            <div className="plan-grid">
              {plansList.map((p) => {
                const isActive = p.id === activePlanId;
                const data = generatedPlans[p.id];
                return (
                  <button
                    key={p.id}
                    className={`plan-card ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setActivePlanId(p.id);
                      setPicked({
                        breakfast: null,
                        lunch: null,
                        snack: null,
                        dinner: null,
                      });
                    }}
                    type="button"
                  >
                    <div className="plan-title">{p.label}</div>
                    <div className="muted small">
                      Options: <b>{data?.stats?.count || 0}</b> • Pool:{" "}
                      <b>{data?.stats?.baseCount || 0}</b>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid" style={{ marginTop: 16 }}>
              <div className="card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Choose 1 option per meal</h2>
                    <p className="muted">
                      Selected Plan: <b>{activePlan?.meta?.label || "-"}</b>
                    </p>
                  </div>
                </div>

                {activePlan ? (
                  <div className="meal-block">
                    {MEALS.map((m) => {
                      const opts = activePlan.meals[m] || [];
                      return (
                        <div key={m} className="meal-section">
                          <div className="meal-head">
                            <div className="meal-name">{m.toUpperCase()}</div>
                            <button
                              className="btn-outline"
                              type="button"
                              onClick={() => refreshOnlyMeal(m)}
                              disabled={busyGen}
                            >
                              Refresh
                            </button>
                          </div>

                          {opts.length === 0 ? (
                            <div className="empty">
                              <p className="muted small">
                                No options matched for <b>{m}</b>.
                              </p>
                            </div>
                          ) : (
                            <div className="radio-grid">
                              {opts.slice(0, 4).map((f) => (
                                <label key={String(f.food_id)} className="radio-card">
                                  <input
                                    type="radio"
                                    name={`meal_${m}`}
                                    checked={picked[m]?.food_id === f.food_id}
                                    onChange={() => setPicked((prev) => ({ ...prev, [m]: f }))}
                                  />
                                  <div className="radio-main">
                                    <div className="radio-title">{f.food_name}</div>
                                    <div className="radio-meta">
                                      <span>{Math.round(safeNum(f.calories_kcal))} kcal</span>
                                      <span>P {safeNum(f.protein_g)}g</span>
                                      <span>F {safeNum(f.fat_g)}g</span>
                                      <span>Fi {safeNum(f.fiber_g)}g</span>
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty">
                    <p>No plan selected.</p>
                  </div>
                )}
              </div>

              <div className="summary card">
                <div className="card-head">
                  <div>
                    <h2 className="card-title">Your Plan Summary</h2>
                    <p className="muted small">Breakfast + Lunch + Dinner required</p>
                  </div>
                </div>

                <div className="summary-block">
                  {MEALS.map((m) => (
                    <div className="summary-section" key={m}>
                      <div className="summary-head">
                        <span className="summary-title">{m.toUpperCase()}</span>
                        <span className="summary-count">{picked[m] ? 1 : 0}</span>
                      </div>

                      {picked[m] ? (
                        <div className="summary-one">
                          <b>{picked[m].food_name}</b>
                          <div className="muted small">
                            {Math.round(safeNum(picked[m].calories_kcal))} kcal • P{" "}
                            {safeNum(picked[m].protein_g)}g • F {safeNum(picked[m].fat_g)}g • Fi{" "}
                            {safeNum(picked[m].fiber_g)}g
                          </div>
                        </div>
                      ) : (
                        <div className="muted small">Not selected</div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="cta">
                  <button
                    className="btn-primary"
                    disabled={!canFollow || busyGen}
                    onClick={followPlan}
                  >
                    Follow this Plan
                  </button>
                  {!canFollow ? (
                    <p className="muted small">Select Breakfast, Lunch, Dinner.</p>
                  ) : (
                    <p className="muted small">Will save in Results.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <style>{`
        .input, .select {
          width: 100%;
          padding: 12px 12px;
          border-radius: 12px;
          border: 1px solid rgba(132,160,255,0.18);
          background: rgba(9,13,35,0.25);
          color: rgba(234,240,255,0.9);
          outline: none;
        }
        .input::placeholder { color: rgba(234,240,255,0.45); }
html, body {
  height: 100%;
  margin: 0;
}

body{
  /* ✅ whole app background */
background-image: url("/images/ffdd838c-3731-406f-ae58-41503aa463a8.png");  
  background-repeat: repeat-y;
  background-position: center top;
  background-size: 100% auto;   /* full width, repeat-y */
  background-attachment: fixed; /* optional: scroll lo stable look */
}

        .sb-overlay{
          position: fixed; inset:0;
          background: rgba(0,0,0,0.45);
          display:flex; align-items:center; justify-content:center;
          z-index: 9999;
        }
        .sb-box{
          background: rgba(10,16,40,0.9);
          border: 1px solid rgba(160,190,255,0.25);
          border-radius: 18px;
          padding: 18px 20px;
          min-width: 320px;
          text-align:center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
        }
        .sb-spinner{
          width: 36px; height: 36px;
          border-radius: 999px;
          border: 4px solid rgba(255,255,255,0.15);
          border-top-color: rgba(120,180,255,0.9);
          margin: 0 auto 10px;
          animation: spin 0.9s linear infinite;
        }
        @keyframes spin{ to { transform: rotate(360deg); } }
        .sb-title{ font-weight:800; font-size: 18px; }
        .sb-sub{ opacity:0.85; margin-top: 4px; font-size: 13px; }
      `}</style>
    </div>
  );
}
