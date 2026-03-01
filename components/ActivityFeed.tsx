"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface FeedItem {
  id: string;
  time: number;
  status: "ok" | "error" | "warn";
  label: string;
  detail: string;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ActivityFeed() {
  const cronJobs = useQuery(api.cron.getCronJobs);
  const reports = useQuery(api.reports.listReports, { limit: 5 });
  const trades = useQuery(api.trading.getRecentTrades, { limit: 5 });

  const items: FeedItem[] = [];

  (cronJobs ?? []).forEach((j: any) => {
    if (j.lastRun) {
      items.push({
        id: `cron-${j.name}`,
        time: j.lastRun,
        status: j.lastStatus === "ok" ? "ok" : j.lastStatus === "error" ? "error" : "warn",
        label: `Cron: ${j.name}`,
        detail: j.lastStatus === "ok" ? "Completed" : j.lastStatus || "unknown",
      });
    }
  });

  (reports ?? []).forEach((r: any) => {
    items.push({
      id: `report-${r._id}`,
      time: r._creationTime || Date.now(),
      status: "ok",
      label: `Report: ${r.title}`,
      detail: r.agent || "system",
    });
  });

  (trades ?? []).forEach((t: any) => {
    const pnl = t.pnl ?? 0;
    items.push({
      id: `trade-${t._id}`,
      time: t.timestamp || t._creationTime || Date.now(),
      status: pnl >= 0 ? "ok" : "error",
      label: `${t.side?.toUpperCase() || "TRADE"} ${t.symbol}`,
      detail: `${t.size ?? ""} @ $${t.price?.toFixed(2) ?? "—"}`,
    });
  });

  items.sort((a, b) => b.time - a.time);
  const display = items.slice(0, 15);

  if (display.length === 0) {
    return (
      <div className="animate-in" style={{
        background: "var(--glass-bg)", backdropFilter: "blur(16px)",
        border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)",
        padding: "var(--space-xl)",
      }}>
        <h2 style={{ margin: 0, marginBottom: "var(--space-lg)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1.5px" }}>⚡ Activity Feed</h2>
        <div className="meta">No recent activity</div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{
      background: "var(--glass-bg)", backdropFilter: "blur(16px)",
      border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)",
      padding: "var(--space-xl)",
      animationDelay: "0.1s",
    }}>
      <h2 style={{ margin: 0, marginBottom: "var(--space-lg)", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1.5px" }}>⚡ Activity Feed</h2>
      <div className="activity-feed">
        {display.map((item) => (
          <div key={item.id} className="activity-item">
            <span className={`activity-dot status-dot ${item.status === "ok" ? "status-ok" : item.status === "error" ? "status-error" : "status-pending"}`} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
              <div className="meta" style={{ fontSize: "var(--text-xs)" }}>{item.detail}</div>
            </div>
            <span className="activity-time">{timeAgo(item.time)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
