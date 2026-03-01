"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Activity, Brain, BookOpen, Wrench, Heart, Gamepad2 } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Progress } from "@/components/ui/progress";

const DIMENSION_CONFIG: Record<string, { icon: React.ReactNode; color: string; description: string; subStats: string[] }> = {
  Body: {
    icon: <Activity className="w-5 h-5" />,
    color: "#10b981",
    description: "Physical vitality and longevity — how you move, fuel, and recover.",
    subStats: ["Movement", "Nutrition", "Sleep", "Health Markers", "Energy"],
  },
  Mind: {
    icon: <Brain className="w-5 h-5" />,
    color: "#8b5cf6",
    description: "Mental clarity, presence, and inner stability.",
    subStats: ["Awareness", "Habits", "Emotions", "Focus", "Presence"],
  },
  Wisdom: {
    icon: <BookOpen className="w-5 h-5" />,
    color: "#3b82f6",
    description: "Intellectual growth and meaning-making.",
    subStats: ["Learning", "Languages", "Research", "Philosophy", "Patterns"],
  },
  Craft: {
    icon: <Wrench className="w-5 h-5" />,
    color: "#f59e0b",
    description: "Professional output, financial growth, and building things that create value.",
    subStats: ["BeGlobal", "AlphaOps", "Finance", "Career", "Building"],
  },
  Connection: {
    icon: <Heart className="w-5 h-5" />,
    color: "#ef4444",
    description: "Relationships and belonging — how you love, bond, and show up for others.",
    subStats: ["Partner", "Friendships", "Family", "Community", "Presence"],
  },
};

// Map TES domain names to 5 dimensions
const DOMAIN_TO_DIMENSION: Record<string, string> = {
  Movement: "Body",
  Mind: "Mind",
  Money: "Craft",
  Systems: "Wisdom",
  Love: "Connection",
  Impact: "Connection",
};

function buildRadarData(domains: Record<string, any>) {
  const dimScores: Record<string, number[]> = { Body: [], Mind: [], Wisdom: [], Craft: [], Connection: [] };
  for (const [name, d] of Object.entries(domains)) {
    const dim = DOMAIN_TO_DIMENSION[name];
    if (dim) dimScores[dim].push(d.level * 10 + Math.min(d.xp_in_level / Math.max(d.xp_to_next, 1) * 10, 10));
  }
  return Object.entries(DIMENSION_CONFIG).map(([name]) => ({
    name,
    value: dimScores[name].length > 0
      ? Math.round(dimScores[name].reduce((a, b) => a + b, 0) / dimScores[name].length)
      : 50,
    fullMark: 100,
  }));
}

export default function ProgressPage() {
  const tes = useQuery(api.tes.getTes);
  const ziolo = useQuery(api.ziolo.getZiolo);

  const domains = (tes?.domains as Record<string, any>) || {};
  const badges = ((tes?.badges as string[]) || []).slice(-12);
  const streaks = (tes?.streaks as Record<string, any>) || {};
  const radarData = buildRadarData(domains);

  return (
    <div>
      <div className="page-header-compact">
        <h1><Gamepad2 size={20} style={{ color: "#8b5cf6" }} /> Progress</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-xl)" }}>
        {/* Top section: Radar + Level */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-lg)" }} className="progress-top-grid">
          {/* Radar Chart Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6" style={{ background: "var(--card-hex)", border: "1px solid var(--border-hex)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)" }}>
            <h3 style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "var(--space-lg)" }}>Character Profile</h3>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Radar name="Tom" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: "var(--space-lg)", paddingTop: "var(--space-lg)", borderTop: "1px solid var(--border-hex)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-hex)", textTransform: "uppercase", fontWeight: 700 }}>Overall Level</span>
                <span style={{ fontSize: "var(--text-xs)", color: "#10b981", fontFamily: "'JetBrains Mono', monospace" }}>LVL {tes?.level ?? 1}</span>
              </div>
              <div style={{ width: "100%", height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(100, (tes?.xp ?? 0) / Math.max((tes?.xp ?? 0) + 50, 1) * 100)}%`,
                  height: "100%",
                  background: "#10b981",
                  boxShadow: "0 0 10px rgba(16,185,129,0.5)",
                  borderRadius: 4,
                }} />
              </div>
              <div style={{ textAlign: "center", marginTop: "var(--space-md)" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "#8b5cf6" }}>{(tes?.className as string) || "The Regulated Architect"}</div>
                <div className="mono" style={{ fontSize: "var(--text-sm)", color: "var(--text)" }}>{tes?.totalXp ?? 0} XP</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--muted-hex)" }}>{(tes?.totalEvents as number) || 0} events logged</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dimension stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--space-md)" }}>
          {radarData.map((stat) => {
            const cfg = DIMENSION_CONFIG[stat.name];
            if (!cfg) return null;
            return (
              <div key={stat.name} style={{
                background: "var(--card-hex)", border: "1px solid var(--border-hex)",
                borderRadius: "var(--radius-lg)", padding: "var(--space-xl)",
                transition: "border-color 0.2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-md)" }}>
                  <div style={{ padding: 8, borderRadius: "var(--radius-md)", background: "#1e293b", color: cfg.color }}>
                    {cfg.icon}
                  </div>
                  <span className="mono" style={{ fontSize: "1.5rem", fontWeight: 700, color: cfg.color }}>{stat.value}</span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{stat.name}</h4>
                <p style={{ fontSize: "var(--text-xs)", color: "#94a3b8", marginBottom: "var(--space-md)", lineHeight: 1.5 }}>{cfg.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cfg.subStats.map((sub) => (
                    <span key={sub} style={{
                      padding: "2px 8px", background: "rgba(30,41,59,0.5)", borderRadius: 6,
                      fontSize: "0.6rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px",
                    }}>{sub}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Streaks */}
        {Object.keys(streaks).length > 0 && (
          <div style={{ background: "var(--card-hex)", border: "1px solid var(--border-hex)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)" }}>
            <h3 style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-md)" }}>🔥 Streaks</h3>
            <div className="grid-2">
              {Object.entries(streaks).map(([name, val]: [string, any]) => {
                const days = typeof val === "number" ? val : val?.days ?? val?.current ?? 0;
                return (
                  <div key={name} style={{
                    padding: "var(--space-sm) var(--space-md)", background: "#1e293b",
                    borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "#94a3b8" }}>{name}</span>
                    <span className="metric-value" style={{ color: days >= 7 ? "#10b981" : days >= 3 ? "#f59e0b" : "var(--muted-hex)" }}>{days}d</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ziolo */}
        <div style={{ background: "var(--card-hex)", border: "1px solid var(--border-hex)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)" }}>
          <h3 style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-md)" }}>🌿 Weed-Free</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
            <div className="streak-big">{ziolo?.currentStreak ?? 0}d</div>
            <div>
              <div style={{ fontSize: "var(--text-sm)", color: "#94a3b8" }}>Last use: {ziolo?.lastUseDate ?? "—"}</div>
              <div style={{ fontSize: "var(--text-sm)", color: "#94a3b8", marginTop: 2 }}>
                Month: {ziolo?.monthlyUseDays ?? 0}/{ziolo?.monthlyGoal ?? 8} · Year: {ziolo?.yearlyUseDays ?? 0}/{ziolo?.yearlyGoal ?? 96}
              </div>
              <div style={{ marginTop: "var(--space-sm)" }}>
                <Progress value={Math.min(100, ((ziolo?.monthlyUseDays ?? 0) / (ziolo?.monthlyGoal ?? 8)) * 100)} indicatorColor="#10b981" />
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div style={{ background: "var(--card-hex)", border: "1px solid var(--border-hex)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)" }}>
          <h3 style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "var(--space-md)" }}>🏆 Badges ({badges.length})</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {badges.length > 0 ? (
              [...badges].reverse().map((b: string, i: number) => {
                let borderColor = "var(--border-hex)";
                let textColor = "#94a3b8";
                if (b.startsWith("Gold")) { borderColor = "#ca8a04"; textColor = "#fbbf24"; }
                else if (b.startsWith("Silver")) { borderColor = "#52525b"; textColor = "#a1a1aa"; }
                else { borderColor = "#92400e"; textColor = "#d97706"; }
                return (
                  <span key={i} style={{
                    fontSize: "var(--text-xs)", padding: "3px 8px", borderRadius: "var(--radius-sm)",
                    border: `1px solid ${borderColor}`, color: textColor, background: "#1e293b",
                  }}>{b}</span>
                );
              })
            ) : <div style={{ fontSize: "var(--text-sm)", color: "var(--muted-hex)" }}>No badges yet</div>}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          .progress-top-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
