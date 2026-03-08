import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertDailyBrief = mutation({
  args: {
    date: v.string(),
    domain: v.string(),
    metrics: v.optional(v.any()),
    planToday: v.optional(v.any()),
    actual: v.optional(v.any()),
    delta: v.optional(v.any()),
    adjustment: v.optional(v.any()),
    alert: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyBriefs")
      .withIndex("by_domain_date", (q) =>
        q.eq("domain", args.domain).eq("date", args.date)
      )
      .first();
    const data = { ...args, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("dailyBriefs", data);
    }
  },
});

export const getTodayBriefs = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyBriefs")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

export const getBriefByDomain = query({
  args: { domain: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyBriefs")
      .withIndex("by_domain_date", (q) =>
        q.eq("domain", args.domain).eq("date", args.date)
      )
      .first();
  },
});

export const getRecentBriefs = query({
  args: { domain: v.string(), days: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyBriefs")
      .withIndex("by_domain_date", (q) => q.eq("domain", args.domain))
      .order("desc")
      .take(args.days);
  },
});
