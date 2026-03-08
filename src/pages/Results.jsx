import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LS_HISTORY_KEY = "bmi_plan_history";

function safeParse(json, fallback) {
  try { return JSON.parse(json) ?? fallback; } catch { return fallback; }
}
function formatDT(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? (iso || "") : d.toLocaleString();
}
function normalizeMeals(meals) {
  return {
    breakfast: Array.isArray(meals?.breakfast) ? meals.breakfast : [],
    lunch: Array.isArray(meals?.lunch) ? meals.lunch : [],
    snack: Array.isArray(meals?.snack) ? meals.snack : [],
    dinner: Array.isArray(meals?.dinner) ? meals.dinner : [],
  };
}
function normalizeHistory(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((p) => ({
    id: p.id || ("plan_" + Math.random().toString(16).slice(2)),
    createdAt: p.createdAt || new Date().toISOString(),
    meta: p.meta || {},
    days: Array.isArray(p.days)
      ? p.days.map((d, idx) => ({ dayIndex: d.dayIndex || idx + 1, meals: normalizeMeals(d.meals || d) }))
      : [{ dayIndex: 1, meals: normalizeMeals(p) }],
  }));
}

export default function Results() {
  const nav = useNavigate();
  const location = useLocation();

  const [expandedPlanId, setExpandedPlanId] = useState(location?.state?.justSavedId || "");
  const [history, setHistory] = useState(() => normalizeHistory(safeParse(localStorage.getItem(LS_HISTORY_KEY), [])));

  useEffect(() => {
    // if another tab updated LS, sync
    const onStorage = () => setHistory(normalizeHistory(safeParse(localStorage.getItem(LS_HISTORY_KEY), [])));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const hasPlans = history.length > 0;

  function persist(next) {
    localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(next));
    setHistory(normalizeHistory(next));
  }

  function clearAll() {
    persist([]);
    setExpandedPlanId("");
  }

  function deletePlan(id) {
    const next = history.filter((p) => p.id !== id);
    persist(next);
    if (expandedPlanId === id) setExpandedPlanId("");
  }

  function goRuleDiet() {
    nav("/rule-diet");
  }

  function knowMore(plan) {
    nav("/smartbuddy", { state: { plan } });
  }

  return (
    <div className="results-page">
      <div className="container">
        <h2 className="title">Your Saved Diet Plans</h2>
        <p className="subtitle">
          Here you will see all plans you saved — with <b>date & time</b>
        </p>

        {!hasPlans ? (
          <div className="card">
            <h3 style={{ marginTop: 0 }}>No saved plans yet 😅</h3>
            <p>select plans in RuleDiet page <b>and the click </b> Follow this Plan</p>
            <button className="btn" onClick={goRuleDiet}>Go to RuleDiet</button>
          </div>
        ) : (
          <>
            <div className="actions">
              <button className="btn" onClick={goRuleDiet}>+ Create New Plan</button>
              <button className="btn ghost" onClick={clearAll}>Clear All</button>
            </div>

            {history.map((plan, idx) => {
              const isOpen = expandedPlanId === plan.id;
              const title = `Plan ${history.length - idx}`;
              return (
                <div className="plan-card" key={plan.id}>
                  <div className="plan-top">
                    <div>
                      <div className="plan-title">{title}</div>
                      <div className="plan-meta">
                        <b>Saved:</b> {formatDT(plan.createdAt)}
                        {plan.meta?.bmiCategory && <> &nbsp; | &nbsp; <b>BMI:</b> {plan.meta.bmiCategory}</>}
                        {plan.meta?.planLabel && <> &nbsp; | &nbsp; <b>Plan:</b> {plan.meta.planLabel}</>}
                      </div>
                    </div>

                    <div className="btnrow">
                      <button className="btn small" onClick={() => setExpandedPlanId(isOpen ? "" : plan.id)}>
                        {isOpen ? "Hide" : "View"}
                      </button>

                      {/* ✅ floating tooltip */}
                      <div className="know-wrap">
                       
                        <button className="btn small" onClick={() => knowMore(plan)}>Know more</button>
                      </div>

                      <button className="btn small danger" onClick={() => deletePlan(plan.id)}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="days">
                      {plan.days.map((d) => (
                        <div className="day" key={d.dayIndex}>
                          <div className="day-title">📅 Day {d.dayIndex}</div>
                          <Meal title="🥣 Breakfast" items={d.meals.breakfast} />
                          <Meal title="🍛 Lunch" items={d.meals.lunch} />
                          <Meal title="🍎 Snack" items={d.meals.snack} />
                          <Meal title="🍽️ Dinner" items={d.meals.dinner} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <style>{`
        .results-page{ min-height:100vh; padding: 18px; color: rgba(240,245,255,0.92); }
        .container{ max-width: 980px; margin: 0 auto; }
        .title{ margin: 0 0 6px; font-size: 30px; font-weight: 900; }
        .subtitle{ margin: 0 0 14px; opacity: 0.85; }
        .card, .plan-card, .day{
          background: rgba(7,12,35,0.35);
          border: 1px solid rgba(140,170,255,0.25);
          border-radius: 16px;
          padding: 14px;
        }
        .actions{ display:flex; gap:10px; margin: 10px 0 14px; flex-wrap: wrap; }
        .btn{
          border: 1px solid rgba(140,170,255,0.25);
          background: rgba(255,255,255,0.08);
          color: rgba(240,245,255,0.92);
          padding: 10px 14px;
          border-radius: 12px;
          cursor: pointer;
        }
        .btn:hover{ background: rgba(255,255,255,0.12); }
        .btn.small{ padding: 8px 12px; border-radius: 10px; }
        .btn.ghost{ opacity: 0.85; }
        .btn.danger{ border-color: rgba(255,120,120,0.35); }
        .plan-card{ margin-bottom: 12px; }
        .plan-top{ display:flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .plan-title{ font-size: 22px; font-weight: 900; }
        .plan-meta{ margin-top: 6px; opacity: 0.85; }
        .btnrow{ display:flex; gap: 10px; align-items:center; flex-wrap: wrap; }

        .days{ margin-top: 12px; }
        .day{ margin-bottom: 10px; }
        .day-title{ font-size: 16px; font-weight: 800; margin-bottom: 8px; }

        .meal{ margin: 10px 0; }
        .meal-title{ font-weight: 900; }
        .meal ul{ margin: 6px 0 0 18px; }

        /* ✅ tooltip bubble that floats up-down */
        .know-wrap{ position: relative; display: inline-flex; align-items:center; }
        .know-tip{
          position: absolute;
          bottom: 42px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(20,30,70,0.92);
          border: 1px solid rgba(140,170,255,0.25);
          padding: 8px 10px;
          border-radius: 12px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0.0;
          pointer-events: none;
          animation: floaty 1.6s ease-in-out infinite;
        }
        .know-wrap:hover .know-tip{ opacity: 1; }
        @keyframes floaty {
          0% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-6px); }
          100% { transform: translateX(-50%) translateY(0px); }
        }
      `}</style>
    </div>
  );
}

function Meal({ title, items }) {
  const arr = Array.isArray(items) ? items : [];
  return (
    <div className="meal">
      <div className="meal-title">{title}</div>
      {arr.length === 0 ? (
        <div style={{ opacity: 0.75 }}>—</div>
      ) : (
        <ul>
          {arr.map((it, i) => {
            const name = it?.food_name || it?.name || (typeof it === "string" ? it : "Item");
            const kcal = it?.calories_kcal != null ? Math.round(Number(it.calories_kcal)) : null;
            const p = it?.protein_g != null ? Number(it.protein_g).toFixed(2) : null;
            const f = it?.fat_g != null ? Number(it.fat_g).toFixed(2) : null;
            const fi = it?.fiber_g != null ? Number(it.fiber_g).toFixed(2) : null;

            return (
              <li key={i}>
                <b>{name}</b>
                {kcal != null && (
                  <span style={{ opacity: 0.85 }}>
                    {" "}• {kcal} kcal • P {p}g • F {f}g • Fi {fi}g
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
