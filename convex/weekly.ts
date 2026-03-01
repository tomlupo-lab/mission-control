import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertWeeklyReport = mutation({
  args: {
    domain: v.string(),
    reportDate: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    sourcePath: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weeklyReports")
      .withIndex("by_domain_date", (q) =>
        q.eq("domain", args.domain).eq("reportDate", args.reportDate)
      )
      .first();
    const data = { ...args, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("weeklyReports", data);
    }
  },
});

export const getWeeklyReports = query({
  args: { domain: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.domain) {
      return await ctx.db
        .query("weeklyReports")
        .withIndex("by_domain_date", (q) => q.eq("domain", args.domain!))
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("weeklyReports")
      .withIndex("by_reportDate")
      .order("desc")
      .collect();
  },
});

export const getWeeklyReport = query({
  args: { id: v.id("weeklyReports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
