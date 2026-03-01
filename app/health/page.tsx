"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

function MetricTile({ label, value, unit, color, delay }: { label: string; value: number | string | undefined; unit?: string; color?: string; delay?: number }) {
  const isGreen = color === "var(--green)" || color === "var(--accent-hex)";
  return (
    <Card className="animate-in" style={{ animationDelay: `${delay || 0}s` }}>
      <CardContent style={{ padding: "var(--space-lg)", textAlign: "center" }}>
        <div className="metric-value" style={{
          fontSize: "1.6rem",
          color: color || "var(--accent-hex)",
          textShadow: isGreen ? "0 0 12px rgba(16,185,129,0.3)" : "none",
        }}>
          {value ?? "—"}
          {unit && <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-hex)", marginLeft: 3 }}>{unit}</span>}
        </div>
        <div className="label" style={{ marginTop: "var(--space-sm)" }}>{label}</div>
      </CardContent>
    </Card>
  );
}

function HRVBarColor(hrv: number) {
  if (hrv >= 65) return "#10b981";
  if (hrv >= 50) return "#f59e0b";
  return "#ef4444";
}

function SleepBarColor(score: number) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

export default function HealthPage() {
  const health = useQuery(api.health.getLatestHealth);
  const history = useQuery(api.health.getHealthHistory, { days: 14 });
  const ziolo = useQuery(api.ziolo.getZiolo);

  const hrvData = (history ?? []).filter((h: any) => h.hrv != null).slice(-14).map((h: any) => ({
    date: (h.date || "").slice(5),
    hrv: h.hrv,
  }));
  const sleepData = (history ?? []).filter((h: any) => h.sleepHours != null).slice(-14).map((h: any) => ({
    date: (h.date || "").slice(5),
    hours: Math.round((h.sleepHours || 0) * 10) / 10,
    score: h.sleepScore || 0,
  }));

  return (
    <div>
      <div className="page-header-compact"><h1><Heart size={20} style={{ color: "var(--red)", filter: "drop-shadow(0 0 6px rgba(239,68,68,0.4))" }} /> Health</h1></div>

      {/* Today's metrics */}
      <div className="grid-3" style={{ marginBottom: "var(--space-lg)" }}>
        <MetricTile label="HRV" value={health?.hrv} unit="ms" color="var(--green)" delay={0.05} />
        <MetricTile label="RHR" value={health?.restingHR} unit="bpm" color="var(--red)" delay={0.1} />
        <MetricTile label="Stress" value={health?.stress} color="var(--orange)" delay={0.15} />
        <MetricTile label="Body Battery" value={health?.bodyBattery} color="var(--green)" delay={0.2} />
        <MetricTile label="Steps" value={health?.steps?.toLocaleString()} color="var(--cyan)" delay={0.25} />
        <MetricTile label="Training" value={health?.trainingReadiness} color="var(--purple)" delay={0.3} />
      </div>

      {/* HRV 14-day chart */}
      <Card className="animate-in" style={{ marginBottom: "var(--space-lg)", animationDelay: "0.2s" }}>
        <CardHeader>
          <CardTitle>💓 HRV Trend (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {hrvData.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={hrvData} margin={{ top: 16, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5a6b8a", fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#5a6b8a", fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} domain={[0, "auto"]} />
                <Tooltip
                  contentStyle={{ background: "rgba(10, 16, 28, 0.9)", border: "1px solid rgba(34, 48, 74, 0.4)", borderRadius: 10, fontSize: 12, backdropFilter: "blur(8px)" }}
                  labelStyle={{ color: "#5a6b8a" }}
                />
                <Bar dataKey="hrv" radius={[4, 4, 0, 0]}>
                  {hrvData.map((d, i) => (
                    <Cell key={i} fill={HRVBarColor(d.hrv)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="meta" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>No data</div>
          )}
        </CardContent>
      </Card>

      {/* Sleep 14-day chart */}
      <Card className="animate-in" style={{ marginBottom: "var(--space-lg)", animationDelay: "0.25s" }}>
        <CardHeader>
          <CardTitle>😴 Sleep Trend (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {sleepData.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={sleepData} margin={{ top: 16, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#5a6b8a", fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#5a6b8a", fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ background: "rgba(10, 16, 28, 0.9)", border: "1px solid rgba(34, 48, 74, 0.4)", borderRadius: 10, fontSize: 12, backdropFilter: "blur(8px)" }}
                  labelStyle={{ color: "#5a6b8a" }}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {sleepData.map((d, i) => (
                    <Cell key={i} fill={SleepBarColor(d.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="meta" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>No data</div>
          )}
        </CardContent>
      </Card>

      {/* Ziolo Detail */}
      <Card className="animate-in" style={{ marginBottom: "var(--space-lg)", animationDelay: "0.3s" }}>
        <CardHeader>
          <CardTitle>🌿 Ziolo Detail</CardTitle>
        </CardHeader>
        <CardContent>
          {ziolo ? (
            <div className="flex-col gap-md">
              <div className="flex-between">
                <span className="meta">Current Streak</span>
                <span className="metric-value positive" style={{ textShadow: "0 0 10px rgba(16,185,129,0.3)" }}>{ziolo.currentStreak} days</span>
              </div>
              <div>
                <div className="flex-between meta" style={{ marginBottom: "var(--space-xs)" }}>
                  <span>Monthly: {ziolo.monthlyUseDays}/{ziolo.monthlyGoal}</span>
                  <span>{Math.max(0, ziolo.monthlyGoal - ziolo.monthlyUseDays)} remaining</span>
                </div>
                <Progress value={Math.min(100, (ziolo.monthlyUseDays / ziolo.monthlyGoal) * 100)} indicatorColor="var(--green)" />
              </div>
              <div>
                <div className="flex-between meta" style={{ marginBottom: "var(--space-xs)" }}>
                  <span>Yearly: {ziolo.yearlyUseDays}/{ziolo.yearlyGoal}</span>
                </div>
                <Progress value={Math.min(100, (ziolo.yearlyUseDays / ziolo.yearlyGoal) * 100)} indicatorColor="var(--green)" />
              </div>
            </div>
          ) : (
            <div className="meta">No data yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
