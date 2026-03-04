"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ExternalLink, Check, CheckCheck, Pin, Filter } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string }> = {
  "🍽️ chef": { emoji: "🍽️", color: "var(--orange)" },
  "🏋️ coach": { emoji: "🏋️", color: "var(--green)" },
  "💰 trading": { emoji: "💰", color: "var(--cyan)" },
  "🔬 research": { emoji: "🔬", color: "var(--purple)" },
  "🇮🇹 marco": { emoji: "🇮🇹", color: "#e8853d" },
  "🤖 system": { emoji: "🤖", color: "var(--muted-hex)" },
  "📰 rss": { emoji: "📰", color: "var(--accent-hex)" },
  "📋 briefing": { emoji: "📋", color: "var(--cyan)" },
};

function getCategoryStyle(cat: string) {
  const key = cat.toLowerCase();
  for (const [k, v] of Object.entries(CATEGORY_CONFIG)) {
    if (key.includes(k.split(" ")[1]) || key === k) return v;
  }
  return { emoji: "📌", color: "var(--muted-hex)" };
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function FeedItem({
  item,
  onMarkRead,
  onTogglePin,
}: {
  item: any;
  onMarkRead: (id: Id<"feedItems">) => void;
  onTogglePin: (id: Id<"feedItems">) => void;
}) {
  const style = getCategoryStyle(item.category);
  const isRead = item.read;

  return (
    <Card
      className="animate-in"
      style={{
        marginBottom: "var(--space-sm)",
        opacity: isRead ? 0.6 : 1,
        borderLeft: `3px solid ${style.color}`,
        transition: "opacity 0.3s, transform 0.2s",
        cursor: "pointer",
      }}
      onClick={() => {
        if (!isRead) onMarkRead(item._id);
        if (item.actionUrl) window.open(item.actionUrl, "_blank");
      }}
    >
      <CardContent style={{ padding: "var(--space-md) var(--space-lg)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)" }}>
          {/* Left: category indicator */}
          <div style={{
            fontSize: "1.2rem",
            lineHeight: 1,
            paddingTop: 2,
            filter: isRead ? "grayscale(0.5)" : "none",
          }}>
            {style.emoji}
          </div>

          {/* Center: content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: 2 }}>
              <Badge
                variant="outline"
                style={{
                  fontSize: "0.55rem",
                  padding: "1px 6px",
                  borderColor: style.color,
                  color: style.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {item.category}
              </Badge>
              <span className="meta" style={{ fontSize: "0.6rem" }}>
                {item.source} · {timeAgo(item.createdAt)}
              </span>
              {item.pinned && <Pin size={10} style={{ color: "var(--orange)" }} />}
            </div>
            <div style={{
              fontWeight: isRead ? 400 : 600,
              fontSize: "var(--text-sm)",
              color: isRead ? "var(--muted-hex)" : "var(--fg-hex)",
              lineHeight: 1.4,
            }}>
              {item.title}
            </div>
            {item.body && (
              <div className="meta" style={{
                fontSize: "var(--text-xs)",
                marginTop: 4,
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical" as any,
                overflow: "hidden",
              }}>
                {item.body}
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            {item.actionUrl && (
              <ExternalLink size={14} style={{ color: "var(--accent-hex)", opacity: 0.7 }} />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePin(item._id); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 2,
                color: item.pinned ? "var(--orange)" : "var(--muted-hex)",
                opacity: item.pinned ? 1 : 0.4,
              }}
              title={item.pinned ? "Unpin" : "Pin"}
            >
              <Pin size={12} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
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

  // Separate pinned items
  const pinned = (items ?? []).filter((i) => i.pinned);
  const unpinned = (items ?? []).filter((i) => !i.pinned);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "var(--space-xl)",
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: "var(--text-xl)",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
          }}>
            Feed
            {(unreadCount ?? 0) > 0 && (
              <Badge variant="live" style={{ fontSize: "0.65rem", padding: "2px 8px" }}>
                {unreadCount}
              </Badge>
            )}
          </h1>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            style={{
              background: showUnreadOnly ? "rgba(16,185,129,0.15)" : "transparent",
              border: `1px solid ${showUnreadOnly ? "var(--green)" : "var(--border-hex)"}`,
              borderRadius: 6,
              padding: "4px 10px",
              color: showUnreadOnly ? "var(--green)" : "var(--muted-hex)",
              cursor: "pointer",
              fontSize: "0.7rem",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Filter size={12} />
            Unread
          </button>
          <button
            onClick={() => markAllRead({ category: selectedCategory })}
            style={{
              background: "transparent",
              border: "1px solid var(--border-hex)",
              borderRadius: 6,
              padding: "4px 10px",
              color: "var(--muted-hex)",
              cursor: "pointer",
              fontSize: "0.7rem",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CheckCheck size={12} />
            Read all
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div style={{
        display: "flex",
        gap: "var(--space-xs)",
        marginBottom: "var(--space-lg)",
        overflowX: "auto",
        paddingBottom: 4,
      }}>
        <button
          onClick={() => setSelectedCategory(undefined)}
          style={{
            background: !selectedCategory ? "var(--accent-hex)" : "transparent",
            border: `1px solid ${!selectedCategory ? "var(--accent-hex)" : "var(--border-hex)"}`,
            borderRadius: 20,
            padding: "4px 14px",
            color: !selectedCategory ? "#000" : "var(--muted-hex)",
            cursor: "pointer",
            fontSize: "0.7rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          All
        </button>
        {(categories ?? []).map((cat) => {
          const style = getCategoryStyle(cat);
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(active ? undefined : cat)}
              style={{
                background: active ? style.color : "transparent",
                border: `1px solid ${active ? style.color : "var(--border-hex)"}`,
                borderRadius: 20,
                padding: "4px 14px",
                color: active ? "#000" : style.color,
                cursor: "pointer",
                fontSize: "0.7rem",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: "var(--space-lg)" }}>
          <div className="label" style={{
            fontSize: "0.6rem",
            color: "var(--orange)",
            marginBottom: "var(--space-sm)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
          }}>
            📌 Pinned
          </div>
          {pinned.map((item) => (
            <FeedItem
              key={item._id}
              item={item}
              onMarkRead={(id) => markRead({ id })}
              onTogglePin={(id) => togglePin({ id })}
            />
          ))}
        </div>
      )}

      {/* Feed items */}
      {unpinned.length > 0 ? (
        unpinned.map((item) => (
          <FeedItem
            key={item._id}
            item={item}
            onMarkRead={(id) => markRead({ id })}
            onTogglePin={(id) => togglePin({ id })}
          />
        ))
      ) : items !== undefined ? (
        <Card>
          <CardContent style={{ padding: "var(--space-2xl)", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "var(--space-md)" }}>✨</div>
            <div className="meta">
              {showUnreadOnly ? "All caught up!" : "No items yet"}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="meta" style={{ textAlign: "center", padding: "var(--space-2xl)" }}>
          Loading...
        </div>
      )}
    </div>
  );
}
