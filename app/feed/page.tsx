"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { ExternalLink, Pin, Filter, CheckCheck, Bell } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  chef: { emoji: "🍽️", color: "#f59e0b" },
  coach: { emoji: "🏋️", color: "#10b981" },
  trading: { emoji: "💰", color: "#06b6d4" },
  research: { emoji: "🔬", color: "#8b5cf6" },
  marco: { emoji: "🇮🇹", color: "#e8853d" },
  system: { emoji: "🤖", color: "#5a6b8a" },
  rss: { emoji: "📰", color: "#10b981" },
  briefing: { emoji: "📋", color: "#06b6d4" },
};

function getCategoryStyle(cat: string) {
  const key = cat.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_CONFIG)) {
    if (key.includes(k)) return v;
  }
  return { emoji: "📌", color: "#5a6b8a" };
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function FeedItem({
  item,
  onMarkRead,
  onTogglePin,
  delay,
}: {
  item: any;
  onMarkRead: (id: Id<"feedItems">) => void;
  onTogglePin: (id: Id<"feedItems">) => void;
  delay: number;
}) {
  const style = getCategoryStyle(item.category);
  const isRead = item.read;

  return (
    <div
      className="animate-in"
      style={{
        animationDelay: `${delay}s`,
        background: "var(--glass-bg)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${isRead ? "var(--glass-border)" : `${style.color}22`}`,
        borderLeft: `3px solid ${style.color}`,
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-lg) var(--space-xl)",
        marginBottom: "var(--space-md)",
        opacity: isRead ? 0.55 : 1,
        cursor: "pointer",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease, opacity 0.3s ease",
      }}
      onClick={() => {
        if (!isRead) onMarkRead(item._id);
        if (item.actionUrl) window.open(item.actionUrl, "_blank");
      }}
      onMouseEnter={(e) => {
        if (!isRead) {
          (e.currentTarget as HTMLElement).style.borderColor = `${style.color}44`;
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${style.color}15`;
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "";
        (e.currentTarget as HTMLElement).style.boxShadow = "";
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)" }}>
        {/* Category icon */}
        <div style={{
          padding: 8,
          borderRadius: "var(--radius-md)",
          background: `${style.color}12`,
          color: style.color,
          border: `1px solid ${style.color}20`,
          fontSize: "1rem",
          lineHeight: 1,
          flexShrink: 0,
        }}>
          {style.emoji}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: 4 }}>
            <span style={{
              padding: "2px 8px",
              background: `${style.color}12`,
              borderRadius: 6,
              fontSize: "0.55rem",
              color: style.color,
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.5px",
              border: `1px solid ${style.color}20`,
            }}>
              {item.category}
            </span>
            <span style={{ fontSize: "0.6rem", color: "var(--muted-hex)", fontFamily: "'JetBrains Mono', monospace" }}>
              {item.source} · {timeAgo(item.createdAt)}
            </span>
            {item.pinned && <Pin size={10} style={{ color: "#f59e0b", filter: "drop-shadow(0 0 4px rgba(245,158,11,0.4))" }} />}
          </div>

          <div style={{
            fontWeight: isRead ? 400 : 600,
            fontSize: "var(--text-sm)",
            color: isRead ? "var(--text-secondary)" : "var(--text)",
            lineHeight: 1.4,
            letterSpacing: "0.2px",
          }}>
            {item.title}
          </div>

          {item.body && (
            <div style={{
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              marginTop: 6,
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical" as any,
              overflow: "hidden",
            }}>
              {item.body}
            </div>
          )}

          {/* Action link pill */}
          {item.actionUrl && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 8,
              padding: "3px 10px",
              background: "rgba(14, 20, 32, 0.6)",
              borderRadius: 6,
              fontSize: "0.6rem",
              color: style.color,
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.5px",
              border: "1px solid rgba(34, 48, 74, 0.3)",
            }}>
              <ExternalLink size={9} />
              {item.actionLabel || "Open"}
            </div>
          )}
        </div>

        {/* Pin button */}
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin(item._id); }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            color: item.pinned ? "#f59e0b" : "var(--muted-hex)",
            opacity: item.pinned ? 1 : 0.3,
            transition: "opacity 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          onMouseLeave={(e) => { if (!item.pinned) (e.currentTarget as HTMLElement).style.opacity = "0.3"; }}
          title={item.pinned ? "Unpin" : "Pin"}
        >
          <Pin size={14} />
        </button>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const items = useQuery(api.feed.list, {
    category: selectedCategory,
    unreadOnly: showUnreadOnly,
    limit: 100,
  });
  const unreadCount = useQuery(api.feed.unreadCount);
  const categories = useQuery(api.feed.categories);
  const markRead = useMutation(api.feed.markRead);
  const markAllRead = useMutation(api.feed.markAllRead);
  const togglePin = useMutation(api.feed.togglePin);

  const pinned = (items ?? []).filter((i) => i.pinned);
  const unpinned = (items ?? []).filter((i) => !i.pinned);

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Header */}
      <div className="page-header-compact">
        <h1>
          <Bell size={20} style={{ color: "#10b981", filter: "drop-shadow(0 0 6px rgba(16,185,129,0.4))" }} />
          {" "}Feed
          {(unreadCount ?? 0) > 0 && (
            <span style={{
              marginLeft: "var(--space-sm)",
              padding: "2px 10px",
              background: "rgba(16,185,129,0.15)",
              borderRadius: 20,
              fontSize: "0.7rem",
              color: "#10b981",
              fontWeight: 700,
              border: "1px solid rgba(16,185,129,0.25)",
              textShadow: "0 0 8px rgba(16,185,129,0.3)",
            }}>
              {unreadCount}
            </span>
          )}
        </h1>
      </div>

      {/* Controls */}
      <div className="animate-in" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "var(--space-lg)",
        flexWrap: "wrap",
        gap: "var(--space-sm)",
      }}>
        {/* Category pills */}
        <div style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 2,
        }}>
          <button
            onClick={() => setSelectedCategory(undefined)}
            style={{
              padding: "4px 14px",
              background: !selectedCategory ? "rgba(16,185,129,0.15)" : "rgba(14, 20, 32, 0.6)",
              border: `1px solid ${!selectedCategory ? "rgba(16,185,129,0.3)" : "rgba(34, 48, 74, 0.3)"}`,
              borderRadius: 20,
              color: !selectedCategory ? "#10b981" : "var(--muted-hex)",
              cursor: "pointer",
              fontSize: "0.65rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              transition: "all 0.2s ease",
            }}
          >
            All
          </button>
          {(categories ?? []).map((cat) => {
            const catStyle = getCategoryStyle(cat);
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(active ? undefined : cat)}
                style={{
                  padding: "4px 14px",
                  background: active ? `${catStyle.color}18` : "rgba(14, 20, 32, 0.6)",
                  border: `1px solid ${active ? `${catStyle.color}40` : "rgba(34, 48, 74, 0.3)"}`,
                  borderRadius: 20,
                  color: active ? catStyle.color : "var(--muted-hex)",
                  cursor: "pointer",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  transition: "all 0.2s ease",
                }}
              >
                {catStyle.emoji} {cat.replace(/^[^\w]*\s*/, "")}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 12px",
              background: showUnreadOnly ? "rgba(16,185,129,0.15)" : "rgba(14, 20, 32, 0.6)",
              border: `1px solid ${showUnreadOnly ? "rgba(16,185,129,0.3)" : "rgba(34, 48, 74, 0.3)"}`,
              borderRadius: 6,
              color: showUnreadOnly ? "#10b981" : "var(--muted-hex)",
              cursor: "pointer",
              fontSize: "0.6rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <Filter size={11} /> Unread
          </button>
          <button
            onClick={() => markAllRead({ category: selectedCategory })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 12px",
              background: "rgba(14, 20, 32, 0.6)",
              border: "1px solid rgba(34, 48, 74, 0.3)",
              borderRadius: 6,
              color: "var(--muted-hex)",
              cursor: "pointer",
              fontSize: "0.6rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            <CheckCheck size={11} /> Read all
          </button>
        </div>
      </div>

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: "var(--space-xl)" }}>
          <h3 style={{
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            color: "#f59e0b",
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: "var(--space-md)",
            filter: "drop-shadow(0 0 4px rgba(245,158,11,0.3))",
          }}>
            📌 Pinned
          </h3>
          {pinned.map((item, i) => (
            <FeedItem
              key={item._id}
              item={item}
              onMarkRead={(id) => markRead({ id })}
              onTogglePin={(id) => togglePin({ id })}
              delay={0.03 * i}
            />
          ))}
        </div>
      )}

      {/* Feed items */}
      {unpinned.length > 0 ? (
        <div>
          <h3 style={{
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            color: "var(--muted-hex)",
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: "var(--space-md)",
          }}>
            Recent
          </h3>
          {unpinned.map((item, i) => (
            <FeedItem
              key={item._id}
              item={item}
              onMarkRead={(id) => markRead({ id })}
              onTogglePin={(id) => togglePin({ id })}
              delay={0.03 * (i + pinned.length)}
            />
          ))}
        </div>
      ) : items !== undefined && pinned.length === 0 ? (
        <div className="animate-in" style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(16px)",
          border: "1px solid var(--glass-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-2xl)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "var(--space-md)", filter: "drop-shadow(0 0 8px rgba(16,185,129,0.3))" }}>✨</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
            {showUnreadOnly ? "All caught up!" : "No items yet"}
          </div>
        </div>
      ) : items === undefined ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer" style={{
              height: 80,
              borderRadius: "var(--radius-lg)",
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>
      ) : null}

      {/* Footer */}
      <div style={{
        textAlign: "center",
        padding: "var(--space-xl) 0",
        marginTop: "var(--space-lg)",
        borderTop: "1px solid var(--glass-border)",
        fontSize: "var(--text-xs)",
        color: "var(--muted-hex)",
        letterSpacing: "0.5px",
      }}>
        Mission Control · Feed · {(items ?? []).length} items
      </div>
    </div>
  );
}
