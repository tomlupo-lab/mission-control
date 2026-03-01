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
        <h1><Gamepad2 size={20} style={{ color: "#8b5cf6", filter: "drop-shadow(0 0 6px rgba(139,92,246,0.4))" }} /> Progress</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-xl)" }}>
        {/* Radar Chart Card */}
        <div className="animate-in" style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-2xl)",
        }}>
          <h3 style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "var(--space-xl)" }}>Character Profile</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(34, 48, 74, 0.4)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "#8b9dc3", fontSize: 12, fontFamily: "'Exo 2', sans-serif" }} />
                <Radar name="Tom" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: "var(--space-xl)", paddingTop: "var(--space-xl)", borderTop: "1px solid var(--glass-border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-hex)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "1.5px" }}>Overall Level</span>
              <span style={{ fontSize: "var(--text-xs)", color: "#10b981", fontFamily: "'JetBrains Mono', monospace", textShadow: "0 0 8px rgba(16,185,129,0.3)" }}>LVL {tes?.level ?? 1}</span>
            </div>
            <div style={{ width: "100%", height: 8, background: "rgba(34, 48, 74, 0.4)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                width: `${Math.min(100, (tes?.xp ?? 0) / Math.max((tes?.xp ?? 0) + 50, 1) * 100)}%`,
                height: "100%",
                background: "linear-gradient(90deg, #10b981, #34d399)",
                boxShadow: "0 0 14px rgba(16,185,129,0.5), 0 0 30px rgba(16,185,129,0.2)",
                borderRadius: 4,
              }} />
            </div>
            <div style={{ textAlign: "center", marginTop: "var(--space-lg)" }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#8b5cf6", textShadow: "0 0 10px rgba(139,92,246,0.3)", letterSpacing: "0.5px" }}>{(tes?.className as string) || "The Regulated Architect"}</div>
              <div className="mono" style={{ fontSize: "var(--text-lg)", color: "var(--text)", marginTop: 4, textShadow: "0 0 8px rgba(16,185,129,0.2)" }}>{tes?.totalXp ?? 0} XP</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--muted-hex)", marginTop: 2 }}>{(tes?.totalEvents as number) || 0} events logged</div>
            </div>
          </div>
        </div>

        {/* Dimension stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--space-lg)" }}>
          {radarData.map((stat, idx) => {
            const cfg = DIMENSION_CONFIG[stat.name];
            if (!cfg) return null;
            return (
              <div key={stat.name} className="animate-in" style={{
                animationDelay: `${0.05 * (idx + 1)}s`,
                background: "var(--glass-bg)",
                backdropFilter: "blur(16px)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-xl)",
                transition: "border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${cfg.color}33`;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${cfg.color}15`;
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "";
                (e.currentTarget as HTMLElement).style.boxShadow = "";
                (e.currentTarget as HTMLElement).style.transform = "";
              }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-lg)" }}>
                  <div style={{ padding: 10, borderRadius: "var(--radius-md)", background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}20` }}>
                    {cfg.icon}
                  </div>
                  <span className="mono" style={{ fontSize: "1.6rem", fontWeight: 700, color: cfg.color, textShadow: `0 0 12px ${cfg.color}40` }}>{stat.value}</span>
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text)", marginBottom: 4, letterSpacing: "0.3px" }}>{stat.name}</h4>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", marginBottom: "var(--space-lg)", lineHeight: 1.6 }}>{cfg.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {cfg.subStats.map((sub) => (
                    <span key={sub} style={{
                      padding: "3px 10px", background: "rgba(14, 20, 32, 0.6)", borderRadius: 6,
                      fontSize: "0.6rem", color: "var(--muted-hex)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px",
                      border: "1px solid rgba(34, 48, 74, 0.3)",
                    }}>{sub}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Streaks */}
        {Object.keys(streaks).length > 0 && (
          <div className="animate-in" style={{
            animationDelay: "0.2s",
            background: "var(--glass-bg)", backdropFilter: "blur(16px)",
            border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)"
          }}>
            <h3 style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "var(--space-lg)" }}>🔥 Streaks</h3>
            <div className="grid-2">
              {Object.entries(streaks).map(([name, val]: [string, any]) => {
                const days = typeof val === "number" ? val : val?.days ?? val?.current ?? 0;
                const streakColor = days >= 7 ? "#10b981" : days >= 3 ? "#f59e0b" : "var(--muted-hex)";
                return (
                  <div key={name} style={{
                    padding: "var(--space-md) var(--space-lg)", background: "rgba(14, 20, 32, 0.5)",
                    borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center",
                    border: "1px solid rgba(34, 48, 74, 0.2)",
                  }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{name}</span>
                    <span className="metric-value" style={{ color: streakColor, textShadow: days >= 7 ? "0 0 8px rgba(16,185,129,0.3)" : "none" }}>{days}d</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ziolo */}
        <div className="animate-in" style={{
          animationDelay: "0.25s",
          background: "var(--glass-bg)", backdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)"
        }}>
          <h3 style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "var(--space-lg)" }}>🌿 Weed-Free</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xl)" }}>
            <div className="streak-big">{ziolo?.currentStreak ?? 0}d</div>
            <div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Last use: {ziolo?.lastUseDate ?? "—"}</div>
              <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 4 }}>
                Month: {ziolo?.monthlyUseDays ?? 0}/{ziolo?.monthlyGoal ?? 8} · Year: {ziolo?.yearlyUseDays ?? 0}/{ziolo?.yearlyGoal ?? 96}
              </div>
              <div style={{ marginTop: "var(--space-md)" }}>
                <Progress value={Math.min(100, ((ziolo?.monthlyUseDays ?? 0) / (ziolo?.monthlyGoal ?? 8)) * 100)} indicatorColor="#10b981" />
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="animate-in" style={{
          animationDelay: "0.3s",
          background: "var(--glass-bg)", backdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)"
        }}>
          <h3 style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "var(--space-lg)" }}>🏆 Badges ({badges.length})</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {badges.length > 0 ? (
              [...badges].reverse().map((b: string, i: number) => {
                let borderColor = "var(--glass-border)";
                let textColor = "var(--text-secondary)";
                let bgColor = "rgba(14, 20, 32, 0.5)";
                if (b.startsWith("Gold")) { borderColor = "rgba(202,138,4,0.4)"; textColor = "#fbbf24"; bgColor = "rgba(202,138,4,0.06)"; }
                else if (b.startsWith("Silver")) { borderColor = "rgba(82,82,91,0.4)"; textColor = "#a1a1aa"; bgColor = "rgba(82,82,91,0.06)"; }
                else { borderColor = "rgba(146,64,14,0.4)"; textColor = "#d97706"; bgColor = "rgba(146,64,14,0.06)"; }
                return (
                  <span key={i} style={{
                    fontSize: "var(--text-xs)", padding: "4px 10px", borderRadius: "var(--radius-sm)",
                    border: `1px solid ${borderColor}`, color: textColor, background: bgColor,
                    letterSpacing: "0.3px",
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
