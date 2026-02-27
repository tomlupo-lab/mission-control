import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertCronJob = mutation({
  args: {
    jobId: v.string(),
    name: v.string(),
    schedule: v.string(),
    enabled: v.boolean(),
    lastStatus: v.optional(v.string()),
    lastRunAt: v.optional(v.number()),
    lastDurationMs: v.optional(v.number()),
    lastError: v.optional(v.string()),
    consecutiveErrors: v.optional(v.number()),
    nextRunAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("cronJobs")
      .withIndex("by_jobId", (q) => q.eq("jobId", args.jobId))
      .first();
    const data = { ...args, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("cronJobs", data);
    }
  },
});

export const getCronJobs = query({
  handler: async (ctx) => {
    return await ctx.db.query("cronJobs").collect();
  },
});
