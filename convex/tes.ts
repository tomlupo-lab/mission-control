import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertTes = mutation({
  args: {
    level: v.number(),
    xp: v.number(),
    totalXp: v.number(),
    streaks: v.any(),
    badges: v.array(v.string()),
    domains: v.any(),
    className: v.optional(v.string()),
    totalEvents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("tesCharacter").first();
    const data = { ...args, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("tesCharacter", data);
    }
  },
});

export const getTes = query({
  handler: async (ctx) => {
    return await ctx.db.query("tesCharacter").first();
  },
});
