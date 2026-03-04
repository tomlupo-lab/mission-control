import { mutation, query, action, httpAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// --- Queries ---

export const list = query({
  args: {
    category: v.optional(v.string()),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.unreadOnly) {
      const items = await ctx.db
        .query("feedItems")
        .withIndex("by_read", (q) => q.eq("read", false))
        .order("desc")
        .take(limit);
      if (args.category) return items.filter((i) => i.category === args.category);
      return items;
    }

    if (args.category) {
      return await ctx.db
        .query("feedItems")
        .withIndex("by_category", (q) => q.eq("category", args.category))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("feedItems")
      .withIndex("by_createdAt")
      .order("desc")
      .take(limit);
  },
});

export const unreadCount = query({
  handler: async (ctx) => {
    const items = await ctx.db
      .query("feedItems")
      .withIndex("by_read", (q) => q.eq("read", false))
      .take(200);
    return items.length;
  },
});

export const categories = query({
  handler: async (ctx) => {
    const recent = await ctx.db
      .query("feedItems")
      .withIndex("by_createdAt")
      .order("desc")
      .take(200);
    const cats = new Set(recent.map((i) => i.category));
    return Array.from(cats).sort();
  },
});

// --- Mutations ---

export const push = mutation({
  args: {
    source: v.string(),
    category: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    actionLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("feedItems", {
      ...args,
      read: false,
      pinned: false,
      createdAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { id: v.id("feedItems") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { read: true });
  },
});

export const markAllRead = mutation({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("feedItems")
      .withIndex("by_read", (q) => q.eq("read", false))
      .take(200);
    const filtered = args.category
      ? items.filter((i) => i.category === args.category)
      : items;
    for (const item of filtered) {
      await ctx.db.patch(item._id, { read: true });
    }
    return filtered.length;
  },
});

export const togglePin = mutation({
  args: { id: v.id("feedItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (item) await ctx.db.patch(args.id, { pinned: !item.pinned });
  },
});

export const cleanup = mutation({
  args: { keepDays: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - (args.keepDays ?? 30) * 86400000;
    const old = await ctx.db
      .query("feedItems")
      .withIndex("by_createdAt")
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .take(200);
    const unpinned = old.filter((i) => !i.pinned);
    for (const item of unpinned) {
      await ctx.db.delete(item._id);
    }
    return unpinned.length;
  },
});
