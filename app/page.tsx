"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import ActivityFeed from "@/components/ActivityFeed";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function KPICard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <Card>
      <CardContent style={{ padding: "var(--space-md)", textAlign: "center" }}>
        <div style={{ fontSize: "1.1rem", marginBottom: "var(--space-xs)" }}>{icon}</div>
        <div className="label">{label}</div>
        <div className="metric-value" style={{ color: color || "var(--accent-hex)", fontSize: "var(--text-2xl)" }}>{value}</div>
        {sub && <div className="meta" style={{ fontSize: "var(--text-xs)", marginTop: 2 }}>{sub}</div>}
      </CardContent>
    </Card>
  );
}

function VitalsStrip({ health }: { health: any }) {
  if (!health) return null;
  const items = [
    { label: "BB", value: health.bodyBattery, max: 100, color: "var(--green)" },
    { label: "TR", value: health.trainingReadiness, max: 100, color: "var(--purple)" },
  ].filter(i => i.value != null);
  if (items.length === 0) return null;

  return (
    <Card style={{ marginBottom: "var(--space-md)" }}>
      <CardContent style={{ padding: "var(--space-md)" }}>
        <div style={{ display: "flex", gap: "var(--space-lg)" }}>
          {items.map(i => (
            <div key={i.label} style={{ flex: 1 }}>
              <div className="flex-between" style={{ marginBottom: 4 }}>
                <span className="label">{i.label}</span>
                <span className="mono" style={{ fontSize: "var(--text-sm)", color: i.color }}>{i.value}</span>
              </div>
              <Progress value={Math.min(100, i.value)} indicatorColor={i.color} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TodayMealsSummary({ mealLog }: { mealLog: any[] }) {
  const todayDate = new Date().toISOString().slice(0, 10);
  const todayLogged = mealLog.filter((m: any) => m.date === todayDate);
  const logTotal = todayLogged.reduce((s: number, m: any) => s + (m.kcal || 0), 0);
  const logP = todayLogged.reduce((s: number, m: any) => s + (m.protein || 0), 0);
  const logC = todayLogged.reduce((s: number, m: any) => s + (m.carbs || 0), 0);
  const logF = todayLogged.reduce((s: number, m: any) => s + (m.fat || 0), 0);

  return (
    <Link href="/meals" style={{ textDecoration: "none", color: "inherit" }}>
      <Card style={{ cursor: "pointer", marginBottom: "var(--space-md)" }}>
        <CardContent style={{ padding: "var(--space-lg)" }}>
          <div className="flex-between" style={{ marginBottom: "var(--space-sm)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "0.5px" }}>🍽️ Today&apos;s Meals</h2>
            <span className="meta">→</span>
          </div>
          {todayLogged.length > 0 ? (
            <div>
              <div style={{ marginBottom: "var(--space-sm)" }}>
                <span className="metric-value" style={{ fontSize: "var(--text-xl)", color: "var(--green)" }}>
                  {Math.round(logTotal)} kcal
                </span>
                <span className="meta" style={{ marginLeft: "var(--space-sm)" }}>P: {Math.round(logP)}g · {todayLogged.length} items</span>
              </div>
              <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                <div style={{ flex: 1 }}>
                  <div className="flex-between" style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: "0.6rem", color: "var(--muted-hex)" }}>C</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--cyan)" }}>{Math.round(logC)}g</span>
                  </div>
                  <Progress value={Math.min(100, (logC / 230) * 100)} indicatorColor="var(--cyan)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex-between" style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: "0.6rem", color: "var(--muted-hex)" }}>P</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--green)" }}>{Math.round(logP)}g</span>
                  </div>
                  <Progress value={Math.min(100, (logP / 100) * 100)} indicatorColor="var(--green)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex-between" style={{ marginBottom: 2 }}>
                    <span style={{ fontSize: "0.6rem", color: "var(--muted-hex)" }}>F</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--orange)" }}>{Math.round(logF)}g</span>
                  </div>
                  <Progress value={Math.min(100, (logF / 60) * 100)} indicatorColor="var(--orange)" />
                </div>
              </div>
            </div>
          ) : (
            <div className="meta">No meals logged yet</div>
          )}
        </CardContent>
      </Card>
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
      <Card style={{ cursor: "pointer", marginBottom: "var(--space-md)" }}>
        <CardContent style={{ padding: "var(--space-lg)" }}>
          <div className="flex-between" style={{ marginBottom: "var(--space-sm)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "0.5px" }}>📈 Positions</h2>
            <span className="meta">→</span>
          </div>
          <div className="metric-value" style={{ fontSize: "var(--text-xl)", color: "var(--green)" }}>${totalEquity.toFixed(2)}</div>
          {allPositions.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginTop: "var(--space-sm)", flexWrap: "wrap" }}>
              {allPositions.map((p: any) => (
                <Badge key={p.symbol} variant={p.side === "short" ? "destructive" : "live"}>
                  {p.symbol} {p.side === "short" ? "↓" : "↑"} ${p.notional?.toFixed(0)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function ZioloCard({ ziolo }: { ziolo: any }) {
  if (!ziolo) return null;
  const streak = ziolo.currentStreak ?? 0;
  const overBudget = ziolo.monthlyUseDays > ziolo.monthlyGoal;
  return (
    <Card style={{ marginBottom: "var(--space-md)", background: overBudget ? "var(--red-dim)" : "var(--green-dim)", border: `1px solid ${overBudget ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)"}` }}>
      <CardContent style={{ padding: "var(--space-lg)" }}>
        <span style={{ fontWeight: 600 }}>🌿 {streak}d clean</span>
        <span className="meta" style={{ marginLeft: "var(--space-sm)" }}>
          Month: {ziolo.monthlyUseDays}/{ziolo.monthlyGoal}
          {overBudget && <span style={{ color: "var(--red)", marginLeft: 4 }}>⚠ over budget</span>}
        </span>
      </CardContent>
    </Card>
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

      {/* Vitals Strip */}
      <VitalsStrip health={health} />

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        <div className="dashboard-left">
          <ActivityFeed />
        </div>
        <div className="dashboard-right">
          <TodayMealsSummary mealLog={mealLog ?? []} />
          <PortfolioSummary strategies={strategies ?? []} />
          <ZioloCard ziolo={ziolo} />
        </div>
      </div>
    </div>
  );
}
