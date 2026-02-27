import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertActivity = mutation({
  args: {
    date: v.string(),
    type: v.string(),
    name: v.string(),
    duration: v.optional(v.number()),
    calories: v.optional(v.number()),
    distance: v.optional(v.number()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("activities", args);
  },
});

export const getActivities = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("activities")
      .withIndex("by_date")
      .order("desc")
      .take(args.days * 10);
    return all;
  },
});
