import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertReport = mutation({
  args: {
    reportId: v.string(),
    agent: v.string(),
    reportType: v.string(),
    date: v.string(),
    title: v.string(),
    summary: v.string(),
    content: v.string(),
    contentOverflow: v.optional(v.string()),
    metrics: v.optional(v.any()),
    deliveredTo: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .first();
    const data = { ...args, createdAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("reports", data);
    }
  },
});

export const listReports = query({
  args: {
    agent: v.optional(v.string()),
    reportType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const max = args.limit ?? 50;
    let rows;
    if (args.agent) {
      rows = await ctx.db
        .query("reports")
        .withIndex("by_agent_date", (q) => q.eq("agent", args.agent!))
        .order("desc")
        .take(max);
    } else if (args.reportType) {
      rows = await ctx.db
        .query("reports")
        .withIndex("by_type_date", (q) => q.eq("reportType", args.reportType!))
        .order("desc")
        .take(max);
    } else {
      rows = await ctx.db
        .query("reports")
        .withIndex("by_date")
        .order("desc")
        .take(max);
    }
    return rows.map((r) => ({
      _id: r._id,
      reportId: r.reportId,
      agent: r.agent,
      reportType: r.reportType,
      date: r.date,
      title: r.title,
      summary: r.summary,
      deliveredTo: r.deliveredTo,
      createdAt: r.createdAt,
      hasMetrics: !!r.metrics,
    }));
  },
});

export const getReport = query({
  args: { reportId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_reportId", (q) => q.eq("reportId", args.reportId))
      .first();
  },
});
