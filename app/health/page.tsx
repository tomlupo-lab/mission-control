"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";

function MetricTile({ label, value, unit, color }: { label: string; value: number | string | undefined; unit?: string; color?: string }) {
  return (
    <Card>
      <CardContent style={{ padding: "var(--space-md)", textAlign: "center" }}>
        <div className="metric-value" style={{ fontSize: "1.6rem", color: color || "var(--accent-hex)" }}>
          {value ?? "—"}
          {unit && <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-hex)", marginLeft: 2 }}>{unit}</span>}
        </div>
        <div className="label" style={{ marginTop: "var(--space-xs)" }}>{label}</div>
      </CardContent>
    </Card>
  );
}

function HRVBarColor(hrv: number) {
  if (hrv >= 65) return "var(--green)";
  if (hrv >= 50) return "var(--orange)";
  return "var(--red)";
}

function SleepBarColor(score: number) {
  if (score >= 80) return "var(--green)";
  if (score >= 60) return "var(--orange)";
  return "var(--red)";
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
      <div className="page-header-compact"><h1><Heart size={20} style={{ color: "var(--red)" }} /> Health</h1></div>

      {/* Today's metrics */}
      <div className="grid-3" style={{ marginBottom: "var(--space-md)" }}>
        <MetricTile label="HRV" value={health?.hrv} unit="ms" color="var(--green)" />
        <MetricTile label="RHR" value={health?.restingHR} unit="bpm" color="var(--red)" />
        <MetricTile label="Stress" value={health?.stress} color="var(--orange)" />
        <MetricTile label="Body Battery" value={health?.bodyBattery} color="var(--green)" />
        <MetricTile label="Steps" value={health?.steps?.toLocaleString()} color="var(--cyan)" />
        <MetricTile label="Training" value={health?.trainingReadiness} color="var(--purple)" />
      </div>

      {/* HRV 14-day chart */}
      <Card style={{ marginBottom: "var(--space-md)" }}>
        <CardHeader>
          <CardTitle>💓 HRV Trend (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {hrvData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={hrvData} margin={{ top: 16, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-hex)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-hex)" }} axisLine={false} tickLine={false} domain={[0, "auto"]} />
                <Tooltip
                  contentStyle={{ background: "var(--card2)", border: "1px solid var(--border-hex)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "var(--muted-hex)" }}
                />
                <Bar dataKey="hrv" radius={[3, 3, 0, 0]}>
                  {hrvData.map((d, i) => (
                    <Cell key={i} fill={HRVBarColor(d.hrv)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="meta" style={{ textAlign: "center", padding: "var(--space-xl)" }}>No data</div>
          )}
        </CardContent>
      </Card>

      {/* Sleep 14-day chart */}
      <Card style={{ marginBottom: "var(--space-md)" }}>
        <CardHeader>
          <CardTitle>😴 Sleep Trend (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {sleepData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={sleepData} margin={{ top: 16, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-hex)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-hex)" }} axisLine={false} tickLine={false} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ background: "var(--card2)", border: "1px solid var(--border-hex)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "var(--muted-hex)" }}
                />
                <Bar dataKey="hours" radius={[3, 3, 0, 0]}>
                  {sleepData.map((d, i) => (
                    <Cell key={i} fill={SleepBarColor(d.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="meta" style={{ textAlign: "center", padding: "var(--space-xl)" }}>No data</div>
          )}
        </CardContent>
      </Card>

      {/* Ziolo Detail */}
      <Card style={{ marginBottom: "var(--space-md)" }}>
        <CardHeader>
          <CardTitle>🌿 Ziolo Detail</CardTitle>
        </CardHeader>
        <CardContent>
          {ziolo ? (
            <div className="flex-col gap-md">
              <div className="flex-between">
                <span className="meta">Current Streak</span>
                <span className="metric-value positive">{ziolo.currentStreak} days</span>
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
