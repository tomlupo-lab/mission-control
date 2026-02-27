"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import ActivityFeed from "@/components/ActivityFeed";

function KPICard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: "1.1rem", marginBottom: "var(--space-xs)" }}>{icon}</div>
      <div className="label">{label}</div>
      <div className="value" style={{ color: color || "var(--accent)", fontSize: "var(--text-2xl)" }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

function TodayMealsSummary({ mealPlan, mealLog }: { mealPlan: any; mealLog: any[] }) {
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayLogged = mealLog.filter((m: any) => m.date === todayDate);
  const logTotal = todayLogged.reduce((s: number, m: any) => s + (m.kcal || 0), 0);
  const logP = todayLogged.reduce((s: number, m: any) => s + (m.protein || 0), 0);

  return (
    <Link href="/meals" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card" style={{ cursor: "pointer", marginBottom: "var(--space-md)" }}>
        <div className="flex-between" style={{ marginBottom: "var(--space-sm)" }}>
          <h2 style={{ margin: 0 }}>🍽️ Today&apos;s Meals</h2>
          <span className="meta">→</span>
        </div>
        {todayLogged.length > 0 ? (
          <div>
            <span className="metric-value" style={{ fontSize: "var(--text-xl)", color: "var(--green)" }}>
              {Math.round(logTotal)} kcal
            </span>
            <span className="meta" style={{ marginLeft: "var(--space-sm)" }}>P: {Math.round(logP)}g · {todayLogged.length} items</span>
          </div>
        ) : (
          <div className="meta">No meals logged yet</div>
        )}
      </div>
    </Link>
  );
}

function PortfolioSummary({ strategies }: { strategies: any[] }) {
  const live = strategies.filter((s) => s.mode === "live");
  if (live.length === 0) return null;
  const totalEquity = live.reduce((s, st) => s + (st.equity ?? 0), 0);
  const allPositions = live.flatMap((s) => s.positionBreakdown ?? []).filter((p: any) => p.notional > 0);

  return (
    <Link href="/trading" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card" style={{ cursor: "pointer", marginBottom: "var(--space-md)" }}>
        <div className="flex-between" style={{ marginBottom: "var(--space-sm)" }}>
          <h2 style={{ margin: 0 }}>📈 Positions</h2>
          <span className="meta">→</span>
        </div>
        <div className="metric-value" style={{ fontSize: "var(--text-xl)", color: "var(--green)" }}>${totalEquity.toFixed(2)}</div>
        {allPositions.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: "var(--space-sm)", flexWrap: "wrap" }}>
            {allPositions.map((p: any) => (
              <span key={p.symbol} className={p.side === "short" ? "pill pill-red" : "pill pill-green"}>
                {p.symbol} {p.side === "short" ? "↓" : "↑"} ${p.notional?.toFixed(0)}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function ZioloCard({ ziolo }: { ziolo: any }) {
  if (!ziolo) return null;
  const streak = ziolo.currentStreak ?? 0;
  const overBudget = ziolo.monthlyUseDays > ziolo.monthlyGoal;
  return (
    <div className="card" style={{ marginBottom: "var(--space-md)", background: overBudget ? "var(--red-dim)" : "var(--green-dim)", border: `1px solid ${overBudget ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)"}` }}>
      <span style={{ fontWeight: 600 }}>🌿 {streak}d clean</span>
      <span className="meta" style={{ marginLeft: "var(--space-sm)" }}>
        Month: {ziolo.monthlyUseDays}/{ziolo.monthlyGoal}
        {overBudget && <span style={{ color: "var(--red)", marginLeft: 4 }}>⚠ over budget</span>}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const health = useQuery(api.health.getLatestHealth);
  const strategies = useQuery(api.trading.getStrategies);
  const mealPlan = useQuery(api.meals.getLatestMealPlan);
  const mealLog = useQuery(api.meals.getMealLog, { days: 7 });
  const ziolo = useQuery(api.ziolo.getZiolo);
  const tes = useQuery(api.tes.getTes);

  const live = (strategies ?? []).filter((s) => s.mode === "live");
  const totalEquity = live.reduce((s, st) => s + (st.equity ?? 0), 0);
  const dailyPnl = live.reduce((s, st) => s + ((st as any).dailyPnl ?? (st.return1d ?? 0)), 0);

  const todayDate = new Date().toISOString().slice(0, 10);
  const todayLogged = (mealLog ?? []).filter((m: any) => m.date === todayDate);
  const todayKcal = todayLogged.reduce((s: number, m: any) => s + (m.kcal || 0), 0);

  return (
    <div>
      {/* KPI Row */}
      <div className="grid-4 kpi-row" style={{ marginBottom: "var(--space-xl)" }}>
        <KPICard
          icon="❤️" label="HRV"
          value={health?.hrv ? `${health.hrv}` : "—"}
          color={health?.hrv && health.hrv >= 60 ? "var(--green)" : "var(--orange)"}
          sub={health?.bodyBattery ? `BB ${health.bodyBattery}` : undefined}
        />
        <KPICard
          icon="🌿" label="Streak"
          value={`${ziolo?.currentStreak ?? 0}d`}
          color={(ziolo?.currentStreak ?? 0) >= 3 ? "var(--green)" : "var(--orange)"}
          sub={`${ziolo?.monthlyUseDays ?? 0}/${ziolo?.monthlyGoal ?? 8} mo`}
        />
        <KPICard
          icon="📈" label="Equity"
          value={totalEquity > 0 ? `$${totalEquity.toFixed(0)}` : "—"}
          color={dailyPnl >= 0 ? "var(--green)" : "var(--red)"}
          sub={dailyPnl !== 0 ? `${dailyPnl >= 0 ? "+" : ""}$${dailyPnl.toFixed(0)} 1d` : undefined}
        />
        <KPICard
          icon="🎮" label="TES"
          value={tes?.level ? `Lv ${tes.level}` : "—"}
          color="var(--purple)"
          sub={tes?.totalXp ? `${tes.totalXp} XP` : undefined}
        />
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-left">
          <ActivityFeed />
        </div>
        <div className="dashboard-right">
          <TodayMealsSummary mealPlan={mealPlan} mealLog={mealLog ?? []} />
          <PortfolioSummary strategies={strategies ?? []} />
          <ZioloCard ziolo={ziolo} />
        </div>
      </div>
    </div>
  );
}
