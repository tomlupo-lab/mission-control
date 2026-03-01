"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const AGENTS = [
  { id: "all", label: "All", icon: "📋" },
  { id: "quark", label: "Quark", icon: "⚡" },
  { id: "qq", label: "QQ", icon: "💰" },
  { id: "coach", label: "Coach", icon: "🏋️" },
  { id: "marco", label: "Marco", icon: "🇮🇹" },
  { id: "chef", label: "Chef", icon: "🍽️" },
];

// Map weekly report domains to agent filter ids
const WEEKLY_DOMAIN_TO_AGENT: Record<string, string> = {
  coach: "coach",
  chef: "chef",
  marco: "marco",
  qq: "qq",
};

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
  const [expandedWeeklyId, setExpandedWeeklyId] = useState<string | null>(null);

  const reports = useQuery(api.reports.listReports, {
    agent: agentFilter === "all" ? undefined : agentFilter,
    limit: 50,
  });

  const weeklyReports = useQuery(api.weekly.getWeeklyReports, {
    domain: agentFilter === "all" ? undefined : agentFilter,
  });

  const detail = useQuery(
    api.reports.getReport,
    expandedId ? { reportId: expandedId } : "skip"
  );

  // Merge reports + weekly reports into unified list
  const merged = useMemo(() => {
    const items: any[] = [];
    if (reports) {
      for (const r of reports) {
        items.push({ ...r, _source: "report" });
      }
    }
    if (weeklyReports) {
      for (const w of weeklyReports) {
        const agent = WEEKLY_DOMAIN_TO_AGENT[w.domain] || w.domain;
        if (agentFilter !== "all" && agent !== agentFilter) continue;
        items.push({
          _id: w._id,
          _source: "weekly",
          reportId: `weekly_${w._id}`,
          agent,
          reportType: "weekly",
          date: w.reportDate,
          title: w.title || `${w.domain} weekly`,
          summary: w.summary,
          content: w.content,
          deliveredTo: [],
        });
      }
    }
    items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return items;
  }, [reports, weeklyReports, agentFilter]);

  const grouped = useMemo(() => {
    return groupByDate(merged);
  }, [merged]);

  return (
    <div>
      <div className="page-header-compact"><h1><FileText size={20} style={{ color: "var(--purple)" }} /> Reports</h1></div>

      {/* Agent filter pills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "var(--space-lg)" }}>
        {AGENTS.map((a) => (
          <Badge
            key={a.id}
            variant={agentFilter === a.id ? "live" : "default"}
            onClick={() => { setAgentFilter(a.id); setExpandedId(null); }}
            style={{ cursor: "pointer" }}
          >
            {a.icon} {a.label}
          </Badge>
        ))}
      </div>

      {/* Expanded detail — regular report */}
      {expandedId && detail && (
        <Card style={{ marginBottom: "var(--space-lg)", border: "1px solid var(--border-hex)", padding: "var(--space-xl)" }}>
          <CardContent style={{ padding: 0 }}>
            <div className="flex-between">
              <h2 style={{ fontSize: "var(--text-lg)", margin: 0, textTransform: "none", letterSpacing: 0 }}>{detail.title}</h2>
              <button onClick={() => setExpandedId(null)} style={{ background: "none", border: "none", color: "var(--muted-hex)", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
            </div>
            <div className="meta" style={{ marginBottom: "var(--space-sm)" }}>
              {detail.agent} · {detail.reportType} · {detail.date}
              {(detail.deliveredTo ?? []).map((ch: string) => (
                <span key={ch} style={{ marginLeft: 6 }}>{DELIVERY_ICONS[ch] || "📤"}</span>
              ))}
            </div>
            <div className="prose">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {(detail.content || "") + (detail.contentOverflow || "")}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expanded detail — weekly report (inline content) */}
      {expandedWeeklyId && (() => {
        const wr = merged.find((r) => r._source === "weekly" && r._id === expandedWeeklyId);
        if (!wr) return null;
        return (
          <Card style={{ marginBottom: "var(--space-lg)", border: "1px solid var(--border-hex)", padding: "var(--space-xl)" }}>
            <CardContent style={{ padding: 0 }}>
              <div className="flex-between">
                <h2 style={{ fontSize: "var(--text-lg)", margin: 0, textTransform: "none", letterSpacing: 0 }}>{wr.title}</h2>
                <button onClick={() => setExpandedWeeklyId(null)} style={{ background: "none", border: "none", color: "var(--muted-hex)", cursor: "pointer", fontSize: "1.1rem" }}>✕</button>
              </div>
              <div className="meta" style={{ marginBottom: "var(--space-sm)" }}>
                {wr.agent} · weekly · {wr.date}
              </div>
              <div className="prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {wr.content || "No content available."}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Timeline */}
      {reports === undefined && <div className="shimmer" style={{ height: 200 }} />}
      {reports && Object.keys(grouped).length === 0 && (
        <Card><CardContent className="meta" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          No reports yet. They&apos;ll appear here once cron jobs generate report JSON files.
        </CardContent></Card>
      )}

      {Object.entries(grouped).map(([dateLabel, items]) => (
        <div key={dateLabel} style={{ marginBottom: "var(--space-lg)" }}>
          <div className="label" style={{ fontWeight: 600, marginBottom: "var(--space-sm)" }}>{dateLabel}</div>
          {items.map((r: any) => {
            const agentMeta = AGENTS.find((a) => a.id === r.agent);
            const handleClick = () => {
              if (r._source === "weekly") {
                setExpandedWeeklyId(expandedWeeklyId === r._id ? null : r._id);
                setExpandedId(null);
              } else {
                setExpandedId(expandedId === r.reportId ? null : r.reportId);
                setExpandedWeeklyId(null);
              }
            };
            return (
              <Card key={r._id} onClick={handleClick}
                style={{ marginBottom: "var(--space-sm)", cursor: "pointer" }}>
                <CardContent style={{ padding: "var(--space-lg)" }}>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
