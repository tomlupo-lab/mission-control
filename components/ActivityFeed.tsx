"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  chef: "#f59e0b", coach: "#10b981", trading: "#06b6d4",
  research: "#8b5cf6", marco: "#e8853d", system: "#6b7f99",
  rss: "#10b981", briefing: "#06b6d4",
};

function getCatColor(cat: string): string {
  const key = cat.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "#6b7f99";
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function ActivityFeed() {
  const items = useQuery(api.feed.list, { limit: 10 });
  const unread = useQuery(api.feed.unreadCount);

  return (
    <div className="animate-in" style={{
      background: "var(--glass-bg)", backdropFilter: "blur(16px)",
      border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)",
      padding: "var(--space-xl)", animationDelay: "0.1s",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
        <h2 style={{ margin: 0, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--muted-hex)", textTransform: "uppercase", letterSpacing: "1.5px" }}>
          🔔 Feed
        </h2>
        <Link href="/feed" style={{
          fontSize: "0.6rem", color: "var(--accent-hex)", textDecoration: "none",
          textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 700,
          display: "flex", alignItems: "center", gap: 4,
        }}>
          {(unread ?? 0) > 0 && (
            <span style={{
              padding: "1px 6px", background: "rgba(16,185,129,0.15)", borderRadius: 8,
              fontSize: "0.55rem", border: "1px solid rgba(16,185,129,0.25)",
            }}>{unread}</span>
          )}
          View all →
        </Link>
      </div>
      {(items ?? []).length === 0 ? (
        <div className="meta">No items yet</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {(items ?? []).map((item) => {
            const color = getCatColor(item.category);
            return (
              <div key={item._id} style={{
                display: "flex", alignItems: "center", gap: "var(--space-md)",
                padding: "8px 0", borderBottom: "1px solid rgba(40,56,82,0.25)",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: item.read ? "var(--muted-hex)" : color,
                  boxShadow: item.read ? "none" : `0 0 6px ${color}80`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "var(--text-sm)", fontWeight: item.read ? 400 : 600,
                    color: item.read ? "var(--text-secondary)" : "var(--text)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{item.title}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--muted-hex)" }}>
                    {item.category.replace(/^[^\w]*\s*/, "")}
                  </div>
                </div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--muted-hex)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                  {timeAgo(item.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
