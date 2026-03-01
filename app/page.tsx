"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import ActivityFeed from "@/components/ActivityFeed";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

function KPICard({ icon, label, value, sub, color, delay }: {
  icon: string; label: string; value: string; sub?: string; color?: string; delay?: number;
}) {
  return (
    <Card className="animate-in" style={{ animationDelay: `${delay || 0}s` }}>
      <CardContent style={{ padding: "var(--space-lg)", textAlign: "center" }}>
        <div style={{ fontSize: "1.1rem", marginBottom: "var(--space-sm)", filter: "drop-shadow(0 0 4px rgba(255,255,255,0.1))" }}>{icon}</div>
        <div className="label" style={{ marginBottom: "var(--space-xs)" }}>{label}</div>
        <div className="metric-value" style={{
          color: color || "var(--accent-hex)",
          fontSize: "var(--text-2xl)",
          textShadow: color === "var(--green)" || color === "var(--accent-hex)" || !color
            ? "0 0 12px rgba(16, 185, 129, 0.3)"
            : "none",
        }}>{value}</div>
        {sub && <div className="meta" style={{ fontSize: "var(--text-xs)", marginTop: 4 }}>{sub}</div>}
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
    <Card className="animate-in" style={{ marginBottom: "var(--space-lg)", animationDelay: "0.15s" }}>
      <CardContent style={{ padding: "var(--space-lg)" }}>
        <div style={{ display: "flex", gap: "var(--space-xl)" }}>
          {items.map(i => (
            <div key={i.label} style={{ flex: 1 }}>
              <div className="flex-between" style={{ marginBottom: 6 }}>
                <span className="label">{i.label}</span>
                <span className="mono" style={{ fontSize: "var(--text-sm)", color: i.color, textShadow: `0 0 8px ${i.color === "var(--green)" ? "rgba(16,185,129,0.3)" : "rgba(139,92,246,0.3)"}` }}>{i.value}</span>
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
      <Card className="animate-in" style={{ cursor: "pointer", marginBottom: "var(--space-lg)", animationDelay: "0.1s" }}>
        <CardContent style={{ padding: "var(--space-xl)" }}>
          <div className="flex-between" style={{ marginBottom: "var(--space-md)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1.5px" }}>🍽️ Today&apos;s Meals</h2>
            <span className="meta" style={{ color: "var(--accent-hex)" }}>→</span>
          </div>
          {todayLogged.length > 0 ? (
            <div>
              <div style={{ marginBottom: "var(--space-md)" }}>
                <span className="metric-value" style={{ fontSize: "var(--text-xl)", color: "var(--green)", textShadow: "0 0 12px rgba(16,185,129,0.3)" }}>
                  {Math.round(logTotal)} kcal
                </span>
                <span className="meta" style={{ marginLeft: "var(--space-sm)" }}>P: {Math.round(logP)}g · {todayLogged.length} items</span>
              </div>
              <div style={{ display: "flex", gap: "var(--space-md)" }}>
                <div style={{ flex: 1 }}>
                  <div className="flex-between" style={{ marginBottom: 3 }}>
                    <span style={{ fontSize: "0.6rem", color: "var(--muted-hex)", fontWeight: 600, letterSpacing: "0.5px" }}>C</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--cyan)", fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(logC)}g</span>
                  </div>
                  <Progress value={Math.min(100, (logC / 230) * 100)} indicatorColor="var(--cyan)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex-between" style={{ marginBottom: 3 }}>
                    <span style={{ fontSize: "0.6rem", color: "var(--muted-hex)", fontWeight: 600, letterSpacing: "0.5px" }}>P</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--green)", fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(logP)}g</span>
                  </div>
                  <Progress value={Math.min(100, (logP / 100) * 100)} indicatorColor="var(--green)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex-between" style={{ marginBottom: 3 }}>
                    <span style={{ fontSize: "0.6rem", color: "var(--muted-hex)", fontWeight: 600, letterSpacing: "0.5px" }}>F</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--orange)", fontFamily: "'JetBrains Mono', monospace" }}>{Math.round(logF)}g</span>
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
      <Card className="animate-in" style={{ cursor: "pointer", marginBottom: "var(--space-lg)", animationDelay: "0.15s" }}>
        <CardContent style={{ padding: "var(--space-xl)" }}>
          <div className="flex-between" style={{ marginBottom: "var(--space-md)" }}>
            <h2 style={{ margin: 0, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1.5px" }}>📈 Positions</h2>
            <span className="meta" style={{ color: "var(--accent-hex)" }}>→</span>
          </div>
          <div className="metric-value" style={{ fontSize: "var(--text-xl)", color: "var(--green)", textShadow: "0 0 12px rgba(16,185,129,0.3)" }}>${totalEquity.toFixed(2)}</div>
          {allPositions.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: "var(--space-md)", flexWrap: "wrap" }}>
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
    <Card className="animate-in" style={{
      marginBottom: "var(--space-lg)",
      animationDelay: "0.2s",
      background: overBudget ? "rgba(239, 68, 68, 0.06)" : "rgba(16, 185, 129, 0.06)",
      border: `1px solid ${overBudget ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)"}`,
      boxShadow: overBudget ? "none" : "0 0 20px rgba(16,185,129,0.05)",
    }}>
      <CardContent style={{ padding: "var(--space-xl)" }}>
        <span style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>🌿 <span style={{ color: overBudget ? "var(--red)" : "var(--green)", textShadow: overBudget ? "none" : "0 0 8px rgba(16,185,129,0.3)" }}>{streak}d clean</span></span>
        <span className="meta" style={{ marginLeft: "var(--space-md)" }}>
          Month: {ziolo.monthlyUseDays}/{ziolo.monthlyGoal}
          {overBudget && <span style={{ color: "var(--red)", marginLeft: 6 }}>⚠ over budget</span>}
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
      <div className="grid-4 kpi-row" style={{ marginBottom: "var(--space-2xl)" }}>
        <KPICard
          icon="❤️" label="HRV"
          value={health?.hrv ? `${health.hrv}` : "—"}
          color={health?.hrv && health.hrv >= 60 ? "var(--green)" : "var(--orange)"}
          sub={health?.bodyBattery ? `BB ${health.bodyBattery}` : undefined}
          delay={0.05}
        />
        <KPICard
          icon="🌿" label="Streak"
          value={`${ziolo?.currentStreak ?? 0}d`}
          color={(ziolo?.currentStreak ?? 0) >= 3 ? "var(--green)" : "var(--orange)"}
          sub={`${ziolo?.monthlyUseDays ?? 0}/${ziolo?.monthlyGoal ?? 8} mo`}
          delay={0.1}
        />
        <KPICard
          icon="📈" label="Equity"
          value={totalEquity > 0 ? `$${totalEquity.toFixed(0)}` : "—"}
          color={dailyPnl >= 0 ? "var(--green)" : "var(--red)"}
          sub={dailyPnl !== 0 ? `${dailyPnl >= 0 ? "+" : ""}$${dailyPnl.toFixed(0)} 1d` : undefined}
          delay={0.15}
        />
        <KPICard
          icon="🎮" label="TES"
          value={tes?.level ? `Lv ${tes.level}` : "—"}
          color="var(--purple)"
          sub={tes?.totalXp ? `${tes.totalXp} XP` : undefined}
          delay={0.2}
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
