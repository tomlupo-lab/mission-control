"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function MetricTile({ label, value, unit, color }: { label: string; value: number | string | undefined; unit?: string; color?: string }) {
  return (
    <div className="stat-card">
      <div className="value" style={{ color: color || "var(--accent)" }}>
        {value ?? "—"}
        {unit && <span className="label" style={{ marginLeft: 2, fontSize: "var(--text-xs)" }}>{unit}</span>}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}

export default function HealthPage() {
  const health = useQuery(api.health.getLatestHealth);
  const history = useQuery(api.health.getHealthHistory, { days: 14 });
  const ziolo = useQuery(api.ziolo.getZiolo);

  const hrvData = (history ?? []).filter((h: any) => h.hrv != null).slice(-14);
  const sleepData = (history ?? []).filter((h: any) => h.sleepHours != null).slice(-14);
  const maxHrv = Math.max(...hrvData.map((h: any) => h.hrv), 80);

  return (
    <div>
      <div className="page-header-compact"><h1>❤️ Health</h1></div>

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
      <div className="card" style={{ marginBottom: "var(--space-md)" }}>
        <h2>💓 HRV Trend (14 days)</h2>
        {hrvData.length > 0 ? (
          <>
            <div className="chart-row" style={{ height: 100 }}>
              {hrvData.map((h: any, i: number) => {
                const pct = (h.hrv / maxHrv) * 100;
                const color = h.hrv >= 65 ? "var(--green)" : h.hrv >= 50 ? "var(--orange)" : "var(--red)";
                return (
                  <div key={i} className="chart-bar" style={{ height: `${pct}%`, background: color }}>
                    <span className="chart-val">{h.hrv}</span>
                  </div>
                );
              })}
            </div>
            <div className="chart-labels">
              {hrvData.map((h: any, i: number) => <span key={i}>{(h.date || "").slice(5)}</span>)}
            </div>
          </>
        ) : (
          <div className="meta" style={{ textAlign: "center", padding: "var(--space-xl)" }}>No data</div>
        )}
      </div>

      {/* Sleep 14-day chart */}
      <div className="card" style={{ marginBottom: "var(--space-md)" }}>
        <h2>😴 Sleep Trend (14 days)</h2>
        {sleepData.length > 0 ? (
          <>
            <div className="chart-row" style={{ height: 100 }}>
              {sleepData.map((h: any, i: number) => {
                const pct = ((h.sleepHours || 0) / 10) * 100;
                const color = (h.sleepScore || 0) >= 80 ? "var(--green)" : (h.sleepScore || 0) >= 60 ? "var(--orange)" : "var(--red)";
                return (
                  <div key={i} className="chart-bar" style={{ height: `${pct}%`, background: color }}>
                    <span className="chart-val">{Math.round((h.sleepHours || 0) * 10) / 10}h</span>
                  </div>
                );
              })}
            </div>
            <div className="chart-labels">
              {sleepData.map((h: any, i: number) => <span key={i}>{(h.date || "").slice(5)}</span>)}
            </div>
          </>
        ) : (
          <div className="meta" style={{ textAlign: "center", padding: "var(--space-xl)" }}>No data</div>
        )}
      </div>

      {/* Ziolo Detail */}
      <div className="card" style={{ marginBottom: "var(--space-md)" }}>
        <h2>🌿 Ziolo Detail</h2>
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
              <div className="progress-bar">
                <div className="fill" style={{ width: `${Math.min(100, (ziolo.monthlyUseDays / ziolo.monthlyGoal) * 100)}%`, background: "var(--green)" }} />
              </div>
            </div>
            <div>
              <div className="flex-between meta" style={{ marginBottom: "var(--space-xs)" }}>
                <span>Yearly: {ziolo.yearlyUseDays}/{ziolo.yearlyGoal}</span>
              </div>
              <div className="progress-bar">
                <div className="fill" style={{ width: `${Math.min(100, (ziolo.yearlyUseDays / ziolo.yearlyGoal) * 100)}%`, background: "var(--green)" }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="meta">No data yet</div>
        )}
      </div>
    </div>
  );
}
