"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useRef, useCallback, useMemo } from "react";
import { UtensilsCrossed, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--muted-hex)", marginBottom: 3, fontWeight: 600, letterSpacing: "0.5px" }}>
        <span>{label}</span>
        <span style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{value}g</span>
      </div>
      <Progress value={pct} indicatorColor={color} />
    </div>
  );
}

function ComparisonBar({ planned, actual, target, color, label }: { planned: number; actual: number; target: number; color: string; label: string }) {
  const actualPct = Math.min((actual / target) * 100, 100);
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6rem", color: "var(--muted-hex)", marginBottom: 3, fontWeight: 600 }}>
        <span>{label}</span>
        <span><span style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>{actual}</span><span style={{ color: "var(--muted-hex)" }}>/{planned}g</span></span>
      </div>
      <div style={{ position: "relative" }}>
        <Progress value={Math.min((planned / target) * 100, 100)} indicatorColor={color} style={{ opacity: 0.2 }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
          <Progress value={actualPct} indicatorColor={color} />
        </div>
      </div>
    </div>
  );
}

function DayView({ day, loggedMeals, isToday }: { day: any; loggedMeals: any[]; isToday: boolean }) {
  const hasLog = loggedMeals.length > 0;

  const logTotals = loggedMeals.reduce((acc, m) => ({
    kcal: acc.kcal + (m.kcal || 0),
    protein: acc.protein + (m.protein || 0),
    carbs: acc.carbs + (m.carbs || 0),
    fat: acc.fat + (m.fat || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const logByType: Record<string, any[]> = {};
  for (const m of loggedMeals) {
    const t = m.mealType || "Other";
    if (!logByType[t]) logByType[t] = [];
    logByType[t].push(m);
  }

  return (
    <div style={{ minHeight: 200 }}>
      {/* Day kcal summary */}
      <div className="animate-in" style={{ textAlign: "center", marginBottom: "var(--space-xl)" }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
          {hasLog ? (
            <span style={{
              color: logTotals.kcal > day.totalKcal * 1.1 ? "var(--orange)" : "var(--green)",
              textShadow: logTotals.kcal <= day.totalKcal * 1.1 ? "0 0 14px rgba(16,185,129,0.3)" : "0 0 14px rgba(245,158,11,0.3)",
            }}>
              {Math.round(logTotals.kcal)}
            </span>
          ) : (
            <span style={{ color: "var(--muted-hex)" }}>{day.totalKcal}</span>
          )}
          <span style={{ fontSize: "0.9rem", color: "var(--muted-hex)", fontWeight: 400, fontFamily: "'Exo 2', sans-serif" }}> / {day.totalKcal} kcal</span>
        </div>
        {day.isFish && <span style={{ fontSize: "0.75rem" }}>🐟 Fish day</span>}
      </div>

      {/* Macro bars */}
      <div className="animate-in" style={{ display: "flex", gap: 12, marginBottom: "var(--space-xl)", animationDelay: "0.05s" }}>
        {hasLog ? (
          <>
            <ComparisonBar planned={day.totalCarbs} actual={Math.round(logTotals.carbs)} target={230} color="var(--cyan)" label="Carbs" />
            <ComparisonBar planned={day.totalProtein} actual={Math.round(logTotals.protein)} target={100} color="var(--green)" label="Protein" />
            <ComparisonBar planned={day.totalFat} actual={Math.round(logTotals.fat)} target={60} color="var(--orange)" label="Fat" />
          </>
        ) : (
          <>
            <MacroBar value={day.totalCarbs} target={230} color="var(--cyan)" label="Carbs" />
            <MacroBar value={day.totalProtein} target={100} color="var(--green)" label="Protein" />
            <MacroBar value={day.totalFat} target={60} color="var(--orange)" label="Fat" />
          </>
        )}
      </div>

      {/* Logged meals */}
      {hasLog && (
        <Card className="animate-in" style={{ marginBottom: "var(--space-lg)", animationDelay: "0.1s" }}>
          <CardContent style={{ padding: "var(--space-lg) var(--space-xl)" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--green)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>✅ Logged</div>
            {Object.entries(logByType).map(([type, meals]) => (
              <div key={type} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
                  {getMealEmoji(type)} {type}
                </div>
                {meals.map((m: any, i: number) => (
                  <div key={i} style={{ padding: "5px 0 5px 20px", fontSize: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                      <span style={{ color: "var(--muted-hex)", marginLeft: 8, whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem" }}>{Math.round(m.kcal)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 14, fontSize: "0.6rem", marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>
                      <span style={{ color: "var(--cyan)" }}>C:{Math.round(m.carbs)}g</span>
                      <span style={{ color: "var(--green)" }}>P:{Math.round(m.protein)}g</span>
                      <span style={{ color: "var(--orange)" }}>F:{Math.round(m.fat)}g</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Planned meals */}
      <Card className="animate-in" style={{ animationDelay: hasLog ? "0.15s" : "0.1s" }}>
        <CardContent style={{ padding: "var(--space-lg) var(--space-xl)" }}>
          <div style={{ fontSize: "0.7rem", fontWeight: 700, color: hasLog ? "var(--muted-hex)" : "var(--accent-hex)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "1px" }}>
            📋 {hasLog ? "Planned" : "Plan"}
          </div>
          {day.meals.map((meal: any, i: number) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < day.meals.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  {getMealEmoji(meal.name)} {meal.name}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--muted-hex)", fontFamily: "'JetBrains Mono', monospace" }}>{meal.kcal}</span>
              </div>
              {meal.items && (
                <div style={{ fontSize: "0.7rem", color: "var(--muted-hex)", marginTop: 3 }}>{meal.items}</div>
              )}
              <div style={{ display: "flex", gap: 14, marginTop: 4, fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace" }}>
                <span style={{ color: "var(--cyan)" }}>C:{meal.carbs}g</span>
                <span style={{ color: "var(--green)" }}>P:{meal.protein}g</span>
                <span style={{ color: "var(--orange)" }}>F:{meal.fat}g</span>
              </div>
            </div>
          ))}
          {day.note && (
            <div style={{ fontSize: "0.7rem", color: "var(--orange)", marginTop: 12 }}>⚠️ {day.note}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MealsPage() {
  const mealPlan = useQuery(api.meals.getLatestMealPlan);
  const mealLog = useQuery(api.meals.getMealLog, { days: 7 });

  const logByDate: Record<string, any[]> = {};
  for (const m of (mealLog ?? [])) {
    if (!logByDate[m.date]) logByDate[m.date] = [];
    logByDate[m.date].push(m);
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });

  const planDays = mealPlan?.days ?? [];

  const todayIdx = planDays.findIndex((d: any) =>
    todayStr.toLowerCase().includes(d.day.split(" ")[0].toLowerCase())
  );
  const [currentIdx, setCurrentIdx] = useState(todayIdx >= 0 ? todayIdx : 0);

  const resolvedIdx = todayIdx >= 0 ? todayIdx : 0;

  const logDays = Object.values(logByDate);
  const avg7d = logDays.length ? {
    kcal: Math.round(logDays.reduce((s, d) => s + d.reduce((ss: number, m: any) => ss + (m.kcal || 0), 0), 0) / logDays.length),
    carbs: Math.round(logDays.reduce((s, d) => s + d.reduce((ss: number, m: any) => ss + (m.carbs || 0), 0), 0) / logDays.length),
    protein: Math.round(logDays.reduce((s, d) => s + d.reduce((ss: number, m: any) => ss + (m.protein || 0), 0), 0) / logDays.length),
    fat: Math.round(logDays.reduce((s, d) => s + d.reduce((ss: number, m: any) => ss + (m.fat || 0), 0), 0) / logDays.length),
    days: logDays.length,
  } : null;

  const touchStart = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0 && currentIdx < planDays.length - 1) setCurrentIdx(currentIdx + 1);
      if (diff > 0 && currentIdx > 0) setCurrentIdx(currentIdx - 1);
    }
    touchStart.current = null;
  }, [currentIdx, planDays.length]);

  const currentDay = planDays[currentIdx];
  const isToday = currentDay && todayStr.toLowerCase().includes(currentDay.day.split(" ")[0].toLowerCase());

  let currentLoggedMeals: any[] = [];
  if (currentDay) {
    const dayParts = currentDay.day.match(/(\d+)\s+(\w+)/);
    if (dayParts) {
      const monthMap: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
      const dateStr = `2026-${monthMap[dayParts[2]] || "01"}-${dayParts[1].padStart(2, "0")}`;
      currentLoggedMeals = logByDate[dateStr] || [];
    }
  }

  return (
    <div>
      <div className="page-header-compact"><h1><UtensilsCrossed size={20} style={{ color: "var(--orange)", filter: "drop-shadow(0 0 6px rgba(245,158,11,0.4))" }} /> Meals</h1></div>

      {/* Sticky 7-day average bar */}
      <div className="animate-in" style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(10, 13, 20, 0.9)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--glass-border)",
        padding: "12px 0", marginBottom: "var(--space-xl)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          {[
            { label: "kcal", value: avg7d?.kcal, color: "var(--text)", unit: "", target: 1950 },
            { label: "carbs", value: avg7d?.carbs, color: "var(--cyan)", unit: "g", target: 215 },
            { label: "protein", value: avg7d?.protein, color: "var(--green)", unit: "g", target: 103 },
            { label: "fat", value: avg7d?.fat, color: "var(--orange)", unit: "g", target: 70 },
          ].map((m) => {
            const over = m.value && m.target ? m.value > m.target * 1.1 : false;
            return (
              <div key={m.label}>
                <div style={{
                  fontSize: "1.2rem", fontWeight: 700, color: over ? "var(--orange)" : m.color,
                  fontFamily: "'JetBrains Mono', monospace",
                  textShadow: !over && m.color === "var(--green)" ? "0 0 8px rgba(16,185,129,0.3)" : "none",
                }}>
                  {m.value ?? "—"}{m.unit}
                </div>
                <div style={{ fontSize: "0.55rem", color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                  {m.label}/day
                </div>
              </div>
            );
          })}
        </div>
        {avg7d && (
          <div style={{ textAlign: "center", fontSize: "0.55rem", color: "var(--muted-hex)", marginTop: 6 }}>
            7-day avg · {avg7d.days} days logged
          </div>
        )}
      </div>

      {/* Day navigator */}
      {planDays.length > 0 && (
        <>
          <div className="animate-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-xl)", animationDelay: "0.05s" }}>
            <button
              onClick={() => currentIdx > 0 && setCurrentIdx(currentIdx - 1)}
              disabled={currentIdx === 0}
              style={{
                background: "none", border: "none", cursor: currentIdx > 0 ? "pointer" : "default",
                color: currentIdx > 0 ? "var(--accent-hex)" : "var(--muted-hex)",
                padding: 8, borderRadius: 8, transition: "color 0.2s",
              }}
            >
              <ChevronLeft size={24} />
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: isToday ? "var(--accent-hex)" : "var(--text)", textShadow: isToday ? "0 0 10px rgba(16,185,129,0.3)" : "none" }}>
                {currentDay?.day}
              </div>
              {isToday && (
                <span style={{
                  fontSize: "0.6rem", padding: "2px 10px", borderRadius: 10,
                  background: "rgba(16, 185, 129, 0.1)", color: "var(--accent-hex)",
                  fontWeight: 700, letterSpacing: "1px",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                }}>
                  TODAY
                </span>
              )}
            </div>
            <button
              onClick={() => currentIdx < planDays.length - 1 && setCurrentIdx(currentIdx + 1)}
              disabled={currentIdx >= planDays.length - 1}
              style={{
                background: "none", border: "none", cursor: currentIdx < planDays.length - 1 ? "pointer" : "default",
                color: currentIdx < planDays.length - 1 ? "var(--accent-hex)" : "var(--muted-hex)",
                padding: 8, borderRadius: 8, transition: "color 0.2s",
              }}
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Day dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: "var(--space-xl)" }}>
            {planDays.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                style={{
                  width: i === currentIdx ? 22 : 8, height: 8, borderRadius: 4,
                  background: i === currentIdx ? "var(--accent-hex)" : "rgba(34, 48, 74, 0.5)",
                  boxShadow: i === currentIdx ? "0 0 8px rgba(16, 185, 129, 0.3)" : "none",
                  border: "none", cursor: "pointer", transition: "all 0.25s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Swipeable day content */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: "pan-y" }}
          >
            <DayView day={currentDay} loggedMeals={currentLoggedMeals} isToday={!!isToday} />
          </div>
        </>
      )}

      {!mealPlan && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--muted-hex)", fontSize: "0.85rem" }}>Loading meal plan...</div>
      )}
    </div>
  );
}
