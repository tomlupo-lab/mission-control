"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Gamepad2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const DOMAIN_CONFIG: Record<string, { emoji: string; color: string }> = {
  Movement: { emoji: "🏃", color: "#ef4444" },
  Mind: { emoji: "🧠", color: "#a78bfa" },
  Money: { emoji: "💰", color: "#34d399" },
  Systems: { emoji: "🤖", color: "#2dd4bf" },
  Love: { emoji: "💑", color: "#f472b6" },
  Impact: { emoji: "🌍", color: "#22d3ee" },
};

function LevelRing({ level, xp, totalXp, totalEvents, className }: {
  level: number; xp: number; totalXp: number; totalEvents: number; className: string;
}) {
  const circumference = 2 * Math.PI * 52;
  const progress = Math.min(xp / Math.max(xp + 50, 1), 1);
  const offset = circumference * (1 - progress);

  return (
    <div style={{ textAlign: "center", marginBottom: "var(--space-lg)" }}>
      <div className="level-ring">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-hex)" strokeWidth="8" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="url(#lvlGrad)" strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
          <defs>
            <linearGradient id="lvlGrad" x1="0%" y1="0%" x2="100%">
              <stop offset="0%" stopColor="var(--accent-hex)" />
              <stop offset="100%" stopColor="var(--cyan)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="level-text">
          <div className="level-num">{level}</div>
          <div className="level-label">Level</div>
        </div>
      </div>
      <div style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--purple)", marginBottom: 2 }}>{className}</div>
      <div className="mono" style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>{totalXp} XP</div>
      <div className="meta">{totalEvents} events logged</div>
    </div>
  );
}

export default function ProgressPage() {
  const tes = useQuery(api.tes.getTes);
  const ziolo = useQuery(api.ziolo.getZiolo);

  const domains = (tes?.domains as Record<string, any>) || {};
  const badges = ((tes?.badges as string[]) || []).slice(-12);
  const streaks = (tes?.streaks as Record<string, any>) || {};

  return (
    <div>
      <div className="page-header-compact"><h1><Gamepad2 size={20} style={{ color: "var(--purple)" }} /> Progress</h1></div>

      <LevelRing
        level={tes?.level ?? 1}
        xp={tes?.xp ?? 0}
        totalXp={tes?.totalXp ?? 0}
        totalEvents={(tes?.totalEvents as number) || 0}
        className={(tes?.className as string) || "The Regulated Architect"}
      />

      {/* Domains */}
      <Card style={{ marginBottom: "var(--space-md)" }}>
        <CardHeader><CardTitle>⚔️ Domains</CardTitle></CardHeader>
        <CardContent>
          {Object.entries(domains).map(([name, d]: [string, any]) => {
            const cfg = DOMAIN_CONFIG[name] || { emoji: "?", color: "#666" };
            const pct = d.xp_to_next > 0 ? (d.xp_in_level / d.xp_to_next) * 100 : 100;
            return (
              <div key={name} className="domain-row">
                <span className="domain-emoji">{cfg.emoji}</span>
                <span className="domain-name">{name}</span>
                <div style={{ flex: 1 }}>
                  <Progress value={pct} indicatorColor={cfg.color} />
                </div>
                <span className="domain-level" style={{ color: cfg.color }}>L{d.level}</span>
                <span className="domain-xp">{d.xp_in_level}/{d.xp_to_next}</span>
              </div>
            );
          })}
          {Object.keys(domains).length === 0 && <div className="meta">No domain data yet</div>}
        </CardContent>
      </Card>

      {/* Streaks */}
      {Object.keys(streaks).length > 0 && (
        <Card style={{ marginBottom: "var(--space-md)" }}>
          <CardHeader><CardTitle>🔥 Streaks</CardTitle></CardHeader>
          <CardContent>
            <div className="grid-2">
              {Object.entries(streaks).map(([name, val]: [string, any]) => {
                const days = typeof val === "number" ? val : val?.days ?? val?.current ?? 0;
                return (
                  <div key={name} style={{ padding: "var(--space-sm) var(--space-md)", background: "var(--card2)", borderRadius: "var(--radius-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="meta">{name}</span>
                    <span className="metric-value" style={{ color: days >= 7 ? "var(--green)" : days >= 3 ? "var(--orange)" : "var(--muted-hex)" }}>{days}d</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ziolo */}
      <Card style={{ marginBottom: "var(--space-md)" }}>
        <CardHeader><CardTitle>🌿 Weed-Free</CardTitle></CardHeader>
        <CardContent>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
            <div className="streak-big">{ziolo?.currentStreak ?? 0}d</div>
            <div>
              <div className="meta">Last use: {ziolo?.lastUseDate ?? "—"}</div>
              <div className="meta" style={{ marginTop: 2 }}>
                Month: {ziolo?.monthlyUseDays ?? 0}/{ziolo?.monthlyGoal ?? 8} · Year: {ziolo?.yearlyUseDays ?? 0}/{ziolo?.yearlyGoal ?? 96}
              </div>
              <div style={{ marginTop: "var(--space-sm)" }}>
                <Progress value={Math.min(100, ((ziolo?.monthlyUseDays ?? 0) / (ziolo?.monthlyGoal ?? 8)) * 100)} indicatorColor="var(--green)" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card style={{ marginBottom: "var(--space-md)" }}>
        <CardHeader><CardTitle>🏆 Badges ({badges.length})</CardTitle></CardHeader>
        <CardContent>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {badges.length > 0 ? (
              [...badges].reverse().map((b: string, i: number) => {
                let variant: "default" | "live" | "paper" | "secondary" = "default";
                if (b.startsWith("Gold")) variant = "live";
                else if (b.startsWith("Silver")) variant = "default";
                else variant = "paper";
                return <Badge key={i} variant={variant}>{b}</Badge>;
              })
            ) : <div className="meta">No badges yet</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
