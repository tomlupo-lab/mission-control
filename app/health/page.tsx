"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Heart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, ReferenceLine } from "recharts";

// Baselines from config
const BASELINES = {
  hrv: { min: 78, max: 83, label: "78-83ms" },
  rhr: { min: 50, max: 54, label: "50-54bpm" },
  sleep: { min: 7, max: 8, label: "7-8h" },
};

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

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10;
}

function delta(current: number, previous: number): { text: string; color: string } {
  const diff = current - previous;
  if (Math.abs(diff) < 0.5) return { text: "—", color: "var(--muted-hex)" };
  const sign = diff > 0 ? "+" : "";
  return {
    text: `${sign}${diff.toFixed(1)}`,
    color: diff > 0 ? "#10b981" : "#ef4444",
  };
}

function MetricTile({ label, value, unit, color, delay, sub, baseline }: {
  label: string; value: number | string | undefined; unit?: string;
  color?: string; delay?: number; sub?: React.ReactNode; baseline?: string;
}) {
  const isGreen = color === "#10b981" || color === "var(--green)" || color === "var(--accent-hex)";
  return (
    <div className="animate-in" style={{
      animationDelay: `${delay || 0}s`,
      background: "var(--glass-bg)",
      backdropFilter: "blur(16px)",
      border: "1px solid var(--glass-border)",
      borderRadius: "var(--radius-lg)",
      padding: "var(--space-lg)",
      textAlign: "center",
      transition: "border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = `${color || "#10b981"}33`;
      (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${color || "#10b981"}15`;
      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = "";
      (e.currentTarget as HTMLElement).style.boxShadow = "";
      (e.currentTarget as HTMLElement).style.transform = "";
    }}>
      <div className="metric-value" style={{
        fontSize: "1.6rem",
        color: color || "#10b981",
        textShadow: isGreen ? "0 0 12px rgba(16,185,129,0.3)" : "none",
      }}>
        {value ?? "—"}
        {unit && <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-hex)", marginLeft: 3 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "var(--space-sm)", fontWeight: 600 }}>{label}</div>
      {baseline && (
        <div style={{ fontSize: "0.55rem", color: "var(--muted-hex)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
          baseline: {baseline}
        </div>
      )}
      {sub && <div style={{ marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function DeltaBadge({ d }: { d: { text: string; color: string } }) {
  return (
    <span style={{
      fontSize: "0.55rem", fontFamily: "'JetBrains Mono', monospace",
      color: d.color, fontWeight: 700,
    }}>
      {d.text}
    </span>
  );
}

export default function HealthPage() {
  const health = useQuery(api.health.getLatestHealth);
  const history = useQuery(api.health.getHealthHistory, { days: 14 });

  const allData = history ?? [];
  const last7 = allData.slice(0, 7);
  const prev7 = allData.slice(7, 14);

  // 7d averages
  const hrvAvg7 = avg(last7.filter((h: any) => h.hrv != null).map((h: any) => h.hrv));
  const hrvAvgPrev = avg(prev7.filter((h: any) => h.hrv != null).map((h: any) => h.hrv));
  const sleepAvg7 = avg(last7.filter((h: any) => h.sleepHours != null).map((h: any) => h.sleepHours));
  const sleepAvgPrev = avg(prev7.filter((h: any) => h.sleepHours != null).map((h: any) => h.sleepHours));
  const stressAvg7 = avg(last7.filter((h: any) => h.stress != null).map((h: any) => h.stress));
  const stressAvgPrev = avg(prev7.filter((h: any) => h.stress != null).map((h: any) => h.stress));
  const rhrAvg7 = avg(last7.filter((h: any) => h.restingHR != null).map((h: any) => h.restingHR));
  const rhrAvgPrev = avg(prev7.filter((h: any) => h.restingHR != null).map((h: any) => h.restingHR));

  const hrvDelta = delta(hrvAvg7, hrvAvgPrev);
  const sleepDelta = delta(sleepAvg7, sleepAvgPrev);
  // For stress and RHR, lower is better — flip the color
  const stressDelta = delta(stressAvg7, stressAvgPrev);
  if (stressDelta.text !== "—") stressDelta.color = stressAvg7 < stressAvgPrev ? "#10b981" : "#ef4444";
  const rhrDelta = delta(rhrAvg7, rhrAvgPrev);
  if (rhrDelta.text !== "—") rhrDelta.color = rhrAvg7 < rhrAvgPrev ? "#10b981" : "#ef4444";

  const hrvData = allData.filter((h: any) => h.hrv != null).slice(0, 14).reverse().map((h: any) => ({
    date: (h.date || "").slice(5), hrv: h.hrv,
  }));
  const sleepData = allData.filter((h: any) => h.sleepHours != null).slice(0, 14).reverse().map((h: any) => ({
    date: (h.date || "").slice(5), hours: Math.round((h.sleepHours || 0) * 10) / 10, score: h.sleepScore || 0,
  }));

  const tooltipStyle = {
    background: "rgba(10, 16, 28, 0.9)", border: "1px solid rgba(40, 56, 82, 0.4)",
    borderRadius: 10, fontSize: 12, backdropFilter: "blur(8px)",
  };

  return (
    <div>
      <div className="page-header-compact">
        <h1><Heart size={20} style={{ color: "#ef4444", filter: "drop-shadow(0 0 6px rgba(239,68,68,0.4))" }} /> Health</h1>
      </div>

      {/* 7d Averages Strip */}
      {hrvAvg7 > 0 && (
        <div className="animate-in" style={{
          background: "var(--glass-bg)", backdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)",
          padding: "var(--space-md) var(--space-xl)", marginBottom: "var(--space-lg)",
          display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "var(--space-md)",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.55rem", color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>7d HRV</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#10b981", fontFamily: "'JetBrains Mono', monospace" }}>
              {hrvAvg7} <DeltaBadge d={hrvDelta} />
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.55rem", color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>7d Sleep</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#8b5cf6", fontFamily: "'JetBrains Mono', monospace" }}>
              {sleepAvg7}h <DeltaBadge d={sleepDelta} />
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.55rem", color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>7d Stress</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#f59e0b", fontFamily: "'JetBrains Mono', monospace" }}>
              {stressAvg7} <DeltaBadge d={stressDelta} />
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.55rem", color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>7d RHR</div>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#ef4444", fontFamily: "'JetBrains Mono', monospace" }}>
              {rhrAvg7} <DeltaBadge d={rhrDelta} />
            </div>
          </div>
        </div>
      )}

      {/* Today's metrics — 2 rows of 4 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
        <MetricTile label="HRV" value={health?.hrv} unit="ms" color="#10b981" delay={0.05} baseline={BASELINES.hrv.label} />
        <MetricTile label="RHR" value={health?.restingHR} unit="bpm" color="#ef4444" delay={0.1} baseline={BASELINES.rhr.label} />
        <MetricTile label="Stress" value={health?.stress} color="#f59e0b" delay={0.15} />
        <MetricTile label="Body Battery" value={health?.bodyBattery} color="#10b981" delay={0.2} />
        <MetricTile label="Sleep Score" value={health?.sleepScore} color="#8b5cf6" delay={0.25} />
        <MetricTile label="Sleep" value={health?.sleepHours ? `${health.sleepHours.toFixed(1)}` : undefined} unit="h" color="#8b5cf6" delay={0.3} baseline={BASELINES.sleep.label} />
        <MetricTile label="Training" value={health?.trainingReadiness} color="#a78bfa" delay={0.35} />
        <MetricTile label="Active Cal" value={health?.activeCalories} unit="kcal" color="#06b6d4" delay={0.4} />
      </div>

      {/* Steps + extra row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
        <MetricTile label="Steps" value={health?.steps?.toLocaleString()} color="#06b6d4" delay={0.45} />
        <MetricTile
          label="BB Range"
          value={health?.bodyBatteryLow != null && health?.bodyBatteryHigh != null ? `${health.bodyBatteryLow}–${health.bodyBatteryHigh}` : undefined}
          color="#10b981"
          delay={0.5}
        />
      </div>

      {/* HRV 14-day chart */}
      <div className="animate-in" style={{
        background: "var(--glass-bg)", backdropFilter: "blur(16px)",
        border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)",
        padding: "var(--space-xl)", marginBottom: "var(--space-lg)", animationDelay: "0.2s",
      }}>
        <h3 style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "var(--space-lg)" }}>
          💓 HRV Trend (14 days)
        </h3>
        {hrvData.length > 0 ? (
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={hrvData} margin={{ top: 16, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7f99", fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7f99", fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} domain={[0, "auto"]} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#6b7f99" }} />
              <ReferenceLine y={BASELINES.hrv.min} stroke="#10b98140" strokeDasharray="4 4" />
              <Bar dataKey="hrv" radius={[4, 4, 0, 0]}>
                {hrvData.map((d, i) => <Cell key={i} fill={HRVBarColor(d.hrv)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="meta" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>No data</div>
        )}
      </div>

      {/* Sleep 14-day chart */}
      <div className="animate-in" style={{
        background: "var(--glass-bg)", backdropFilter: "blur(16px)",
        border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)",
        padding: "var(--space-xl)", marginBottom: "var(--space-lg)", animationDelay: "0.25s",
      }}>
        <h3 style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "var(--space-lg)" }}>
          😴 Sleep Trend (14 days)
        </h3>
        {sleepData.length > 0 ? (
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={sleepData} margin={{ top: 16, right: 4, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#6b7f99", fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7f99", fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} domain={[0, 10]} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#6b7f99" }} />
              <ReferenceLine y={BASELINES.sleep.min} stroke="#8b5cf640" strokeDasharray="4 4" />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {sleepData.map((d, i) => <Cell key={i} fill={SleepBarColor(d.score)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="meta" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>No data</div>
        )}
      </div>
    </div>
  );
}
