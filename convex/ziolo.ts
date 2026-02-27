import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertZiolo = mutation({
  args: {
    currentStreak: v.number(),
    lastUseDate: v.string(),
    monthlyUseDays: v.number(),
    monthlyGoal: v.number(),
    yearlyUseDays: v.number(),
    yearlyGoal: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("zioloTracker").first();
    const data = { ...args, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("zioloTracker", data);
    }
  },
});

export const getZiolo = query({
  handler: async (ctx) => {
    return await ctx.db.query("zioloTracker").first();
  },
});
