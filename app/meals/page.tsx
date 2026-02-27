"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

const MEAL_EMOJI: Record<string, string> = {
  Breakfast: "🥣", Lunch: "🍽️", Dinner: "🥗", Snack: "🍎",
  Evening: "🌙", "Flat White": "☕", "Post-workout": "💪",
};

function getMealEmoji(name: string) {
  for (const [key, emoji] of Object.entries(MEAL_EMOJI)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return "🍴";
}

function MacroBar({ value, target, color, label }: { value: number; target: number; color: string; label: string }) {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--muted)", marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color }}>{value}g</span>
      </div>
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function ComparisonBar({ planned, actual, target, color, label }: { planned: number; actual: number; target: number; color: string; label: string }) {
  const plannedPct = Math.min((planned / target) * 100, 100);
  const actualPct = Math.min((actual / target) * 100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", color: "var(--muted)", marginBottom: 2 }}>
        <span>{label}</span>
        <span><span style={{ color }}>{actual}</span><span style={{ color: "var(--muted)" }}>/{planned}g</span></span>
      </div>
      <div style={{ height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", height: "100%", width: `${plannedPct}%`, background: color, opacity: 0.2, borderRadius: 3 }} />
        <div style={{ position: "absolute", height: "100%", width: `${actualPct}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function DayCard({ day, loggedMeals, isToday }: { day: any; loggedMeals: any[]; isToday: boolean }) {
  const [expanded, setExpanded] = useState(isToday);
  const hasLog = loggedMeals.length > 0;

  const logTotals = loggedMeals.reduce((acc, m) => ({
    kcal: acc.kcal + (m.kcal || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  // Group logged meals by type
  const logByType: Record<string, any[]> = {};
  for (const m of loggedMeals) {
    const t = m.mealType || "Other";
    if (!logByType[t]) logByType[t] = [];
    logByType[t].push(m);
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: 8,
        border: isToday ? "1px solid var(--accent)" : "1px solid var(--border)",
        cursor: "pointer",
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Day header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: isToday ? "var(--accent)" : "var(--text)" }}>
            {day.day}
          </span>
          {day.isFish && <span style={{ fontSize: "0.75rem" }}>🐟</span>}
          {isToday && (
            <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 8, background: "rgba(59,130,246,0.15)", color: "var(--accent)", fontWeight: 600 }}>
              TODAY
            </span>
          )}
        </div>
        <div style={{ fontSize: "0.75rem", textAlign: "right" }}>
          {hasLog ? (
            <span>
              <span style={{ color: logTotals.kcal > day.totalKcal * 1.1 ? "var(--orange)" : logTotals.kcal < day.totalKcal * 0.8 ? "var(--red)" : "var(--green)" }}>
                {Math.round(logTotals.kcal)}
              </span>
              <span style={{ color: "var(--muted)" }}>/{day.totalKcal}</span>
            </span>
          ) : (
            <span style={{ color: "var(--muted)" }}>{day.totalKcal} kcal</span>
          )}
        </div>
      </div>

      {/* Macro bars — comparison if logged, plan-only otherwise */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {hasLog ? (
          <>
            <ComparisonBar planned={day.totalCarbs} actual={Math.round(logTotals.carbs)} target={230} color="var(--cyan)" label="C" />
            <ComparisonBar planned={day.totalProtein} actual={Math.round(logTotals.protein)} target={100} color="var(--green)" label="P" />
            <ComparisonBar planned={day.totalFat} actual={Math.round(logTotals.fat)} target={60} color="var(--orange)" label="F" />
          </>
        ) : (
          <>
            <MacroBar value={day.totalCarbs} target={230} color="var(--cyan)" label="C" />
            <MacroBar value={day.totalProtein} target={100} color="var(--green)" label="P" />
            <MacroBar value={day.totalFat} target={60} color="var(--orange)" label="F" />
          </>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          {/* Logged meals (actual) */}
          {hasLog && (
            <>
              <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--green)", marginBottom: 6 }}>✅ Logged</div>
              {Object.entries(logByType).map(([type, meals]) => (
                <div key={type} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                    {getMealEmoji(type)} {type}
                  </div>
                  {meals.map((m: any, i: number) => (
                    <div key={i} style={{ padding: "3px 0 3px 20px", fontSize: "0.7rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{m.name}</span>
                        <span style={{ color: "var(--muted)", marginLeft: 8, whiteSpace: "nowrap" as const }}>{Math.round(m.kcal)} kcal</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, fontSize: "0.6rem", marginTop: 1 }}>
                        <span style={{ color: "var(--cyan)" }}>C: {Math.round(m.carbs)}g</span>
                        <span style={{ color: "var(--green)" }}>P: {Math.round(m.protein)}g</span>
                        <span style={{ color: "var(--orange)" }}>F: {Math.round(m.fat)}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 8, paddingTop: 8 }} />
            </>
          )}

          {/* Planned meals */}
          <div style={{ fontSize: "0.7rem", fontWeight: 600, color: hasLog ? "var(--muted)" : "var(--accent)", marginBottom: 6 }}>
            📋 {hasLog ? "Planned" : "Plan"}
          </div>
          {day.meals.map((meal: any, i: number) => (
            <div key={i} style={{ padding: "5px 0", borderBottom: i < day.meals.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                  {getMealEmoji(meal.name)} {meal.name}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{meal.kcal} kcal</span>
              </div>
              {meal.items && (
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 2 }}>{meal.items}</div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 3, fontSize: "0.65rem" }}>
                <span style={{ color: "var(--cyan)" }}>C: {meal.carbs}g</span>
                <span style={{ color: "var(--green)" }}>P: {meal.protein}g</span>
                <span style={{ color: "var(--orange)" }}>F: {meal.fat}g</span>
              </div>
            </div>
          ))}
          {day.note && (
            <div style={{ fontSize: "0.7rem", color: "var(--orange)", marginTop: 8 }}>⚠️ {day.note}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MealsPage() {
  const mealPlan = useQuery(api.meals.getLatestMealPlan);
  const mealLog = useQuery(api.meals.getMealLog, { days: 7 });

  // Group logged meals by date
  const logByDate: Record<string, any[]> = {};
  for (const m of (mealLog ?? [])) {
    if (!logByDate[m.date]) logByDate[m.date] = [];
    logByDate[m.date].push(m);
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  // Calculate weekly actual averages
  const logDays = Object.values(logByDate);
  const avgActual = logDays.length ? {
    kcal: Math.round(logDays.reduce((s, d) => s + d.reduce((ss: number, m: any) => ss + (m.kcal || 0), 0), 0) / logDays.length),
    carbs: Math.round(logDays.reduce((s, d) => s + d.reduce((ss: number, m: any) => ss + (m.carbs || 0), 0), 0) / logDays.length),
    protein: Math.round(logDays.reduce((s, d) => s + d.reduce((ss: number, m: any) => ss + (m.protein || 0), 0), 0) / logDays.length),
    fat: Math.round(logDays.reduce((s, d) => s + d.reduce((ss: number, m: any) => ss + (m.fat || 0), 0), 0) / logDays.length),
  } : null;

  const planDays = mealPlan?.days ?? [];
  const avgPlan = planDays.length ? {
    kcal: Math.round(planDays.reduce((s: number, d: any) => s + d.totalKcal, 0) / planDays.length),
    carbs: Math.round(planDays.reduce((s: number, d: any) => s + d.totalCarbs, 0) / planDays.length),
    protein: Math.round(planDays.reduce((s: number, d: any) => s + d.totalProtein, 0) / planDays.length),
    fat: Math.round(planDays.reduce((s: number, d: any) => s + d.totalFat, 0) / planDays.length),
  } : null;

  return (
    <div>
      <div className="page-header-compact"><h1>🍽️ Meals</h1></div>

      {/* Weekly overview — plan vs actual */}
      <div className="card" style={{ marginBottom: 12 }}>
        <h2>📊 Weekly Overview</h2>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          {[
            { label: "kcal", plan: avgPlan?.kcal, actual: avgActual?.kcal, color: "var(--text)", unit: "" },
            { label: "carbs", plan: avgPlan?.carbs, actual: avgActual?.carbs, color: "var(--cyan)", unit: "g" },
            { label: "protein", plan: avgPlan?.protein, actual: avgActual?.protein, color: "var(--green)", unit: "g" },
            { label: "fat", plan: avgPlan?.fat, actual: avgActual?.fat, color: "var(--orange)", unit: "g" },
          ].map((m) => (
            <div key={m.label}>
              <div style={{ fontSize: "1.2rem", fontWeight: 700, color: m.color }}>{m.actual ?? "—"}{m.unit}</div>
              {m.plan != null && (
                <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>plan: {m.plan}{m.unit}</div>
              )}
              <div style={{ fontSize: "0.6rem", color: "var(--muted)" }}>{m.label}/day</div>
            </div>
          ))}
        </div>
        {avgActual && (
          <div style={{ textAlign: "center", fontSize: "0.65rem", color: "var(--muted)", marginTop: 6 }}>
            Based on {logDays.length} logged days
          </div>
        )}
      </div>

      {/* Day cards */}
      {planDays.map((day: any, i: number) => {
        const isToday = todayStr.toLowerCase().includes(day.day.split(" ")[0].toLowerCase());
        // Match logged meals by extracting date from day string (e.g. "Monday 23 Feb")
        const dayParts = day.day.match(/(\d+)\s+(\w+)/);
        let loggedMeals: any[] = [];
        if (dayParts) {
          const monthMap: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
          const dateStr = `2026-${monthMap[dayParts[2]] || "01"}-${dayParts[1].padStart(2, "0")}`;
          loggedMeals = logByDate[dateStr] || [];
        }
        return <DayCard key={i} day={day} loggedMeals={loggedMeals} isToday={isToday} />;
      })}

      {!mealPlan && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted)", fontSize: "0.85rem" }}>Loading meal plan...</div>
      )}

      <div style={{
        textAlign: "center", color: "var(--muted)", fontSize: "0.7rem",
        padding: "12px 0", borderTop: "1px solid var(--border)", marginTop: 8,
      }}>
        Mission Control · Chef mode 🍽️
      </div>
    </div>
  );
}
