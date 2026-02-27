"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText } from "lucide-react";

const AGENTS = [
  { id: "all", label: "All", icon: "📋" },
  { id: "quark", label: "Quark", icon: "⚡" },
  { id: "qq", label: "QQ", icon: "💰" },
  { id: "coach", label: "Coach", icon: "🏋️" },
  { id: "marco", label: "Marco", icon: "🇮🇹" },
  { id: "chef", label: "Chef", icon: "🍽️" },
];

const DELIVERY_ICONS: Record<string, string> = {
  telegram: "📱", "discord:#qq": "💬", "discord:#chef": "💬",
  "discord:#coach": "💬", "discord:#marco": "💬", "discord:#daily": "💬",
  "mission-control": "🖥️",
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return dateStr;
}

function groupByDate(items: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  for (const item of items) {
    const label = timeAgo(item.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  return groups;
}

export default function ReportsPage() {
  const [agentFilter, setAgentFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const reports = useQuery(api.reports.listReports, {
    agent: agentFilter === "all" ? undefined : agentFilter,
    limit: 50,
  });

  const detail = useQuery(
    api.reports.getReport,
    expandedId ? { reportId: expandedId } : "skip"
  );

  const grouped = useMemo(() => {
    if (!reports) return {};
    return groupByDate(reports);
  }, [reports]);

  return (
    <div>
      <div className="page-header-compact"><h1><FileText size={20} style={{ color: "var(--purple)" }} /> Reports</h1></div>

      {/* Agent filter pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "var(--space-lg)" }}>
        {AGENTS.map((a) => (
          <button
            key={a.id}
            onClick={() => { setAgentFilter(a.id); setExpandedId(null); }}
            className={agentFilter === a.id ? "pill pill-accent" : "pill pill-muted"}
            style={{ cursor: "pointer", background: agentFilter === a.id ? "var(--accent-dim)" : undefined }}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* Expanded detail */}
      {expandedId && detail && (
        <div className="card-hero" style={{ marginBottom: "var(--space-lg)" }}>
          <div className="flex-between">
            <h2 style={{ fontSize: "var(--text-lg)", margin: 0, textTransform: "none", letterSpacing: 0 }}>{detail.title}</h2>
            <button onClick={() => setExpandedId(null)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
          </div>
          <div className="meta" style={{ marginBottom: "var(--space-sm)" }}>
            {detail.agent} · {detail.reportType} · {detail.date}
            {(detail.deliveredTo ?? []).map((ch: string) => (
              <span key={ch} style={{ marginLeft: 6 }}>{DELIVERY_ICONS[ch] || "📤"}</span>
            ))}
          </div>
          <div style={{ fontSize: "var(--text-base)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {detail.content}
            {detail.contentOverflow && detail.contentOverflow}
          </div>
        </div>
      )}

      {/* Timeline */}
      {reports === undefined && <div className="shimmer" style={{ height: 200 }} />}
      {reports && Object.keys(grouped).length === 0 && (
        <div className="card meta" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          No reports yet. They&apos;ll appear here once cron jobs generate report JSON files.
        </div>
      )}

      {Object.entries(grouped).map(([dateLabel, items]) => (
        <div key={dateLabel} style={{ marginBottom: "var(--space-lg)" }}>
          <div className="label" style={{ fontWeight: 600, marginBottom: "var(--space-sm)" }}>{dateLabel}</div>
          {items.map((r: any) => {
            const agentMeta = AGENTS.find((a) => a.id === r.agent);
            return (
              <div key={r._id} className="card" onClick={() => setExpandedId(expandedId === r.reportId ? null : r.reportId)}
                style={{ marginBottom: "var(--space-sm)", cursor: "pointer" }}>
                <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.2rem" }}>{agentMeta?.icon || "📄"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "var(--text-base)", fontWeight: 600 }}>{r.title}</div>
                    <div className="meta" style={{ marginTop: 2 }}>{r.summary?.slice(0, 120)}</div>
                    <div className="meta" style={{ marginTop: "var(--space-xs)" }}>
                      {r.reportType}
                      {(r.deliveredTo ?? []).map((ch: string) => (
                        <span key={ch} style={{ marginLeft: 4 }}>{DELIVERY_ICONS[ch] || "📤"}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
