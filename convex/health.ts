import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertHealth = mutation({
  args: {
    date: v.string(),
    hrv: v.optional(v.number()),
    sleepScore: v.optional(v.number()),
    sleepHours: v.optional(v.number()),
    stress: v.optional(v.number()),
    bodyBattery: v.optional(v.number()),
    bodyBatteryHigh: v.optional(v.number()),
    bodyBatteryLow: v.optional(v.number()),
    restingHR: v.optional(v.number()),
    steps: v.optional(v.number()),
    activeCalories: v.optional(v.number()),
    trainingReadiness: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("healthSnapshots")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
    const data = { ...args, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("healthSnapshots", data);
    }
  },
});

export const getLatestHealth = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("healthSnapshots")
      .withIndex("by_date")
      .order("desc")
      .first();
  },
});

export const getHealthHistory = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("healthSnapshots")
      .withIndex("by_date")
      .order("desc")
      .take(args.days);
    return all.reverse();
  },
});
