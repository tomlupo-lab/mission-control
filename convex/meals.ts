import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncMealLog = mutation({
  args: {
    date: v.string(),
    meals: v.array(v.object({
      mealType: v.string(),
      name: v.string(),
      kcal: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      satFat: v.optional(v.number()),
      fiber: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    // Delete existing entries for this date
    const existing = await ctx.db
      .query("mealLog")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    for (const e of existing) {
      await ctx.db.delete(e._id);
    }
    // Insert new
    const now = Date.now();
    for (const m of args.meals) {
      await ctx.db.insert("mealLog", { date: args.date, ...m, updatedAt: now });
    }
  },
});

export const getMealLog = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("mealLog")
      .withIndex("by_date")
      .order("desc")
      .take(args.days * 10); // ~10 items per day max
  },
});

export const upsertMealPlan = mutation({
  args: {
    weekLabel: v.string(),
    days: v.array(v.object({
      day: v.string(),
      isFish: v.optional(v.boolean()),
      meals: v.array(v.object({
        name: v.string(),
        items: v.string(),
        kcal: v.number(),
        protein: v.number(),
        carbs: v.number(),
        fat: v.number(),
      })),
      totalKcal: v.number(),
      totalProtein: v.number(),
      totalCarbs: v.number(),
      totalFat: v.number(),
      satFat: v.optional(v.number()),
      note: v.optional(v.string()),
    })),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("mealPlan")
      .withIndex("by_weekLabel", (q) => q.eq("weekLabel", args.weekLabel))
      .first();
    const data = { ...args, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("mealPlan", data);
    }
  },
});

export const getLatestMealPlan = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("mealPlan")
      .withIndex("by_weekLabel")
      .order("desc")
      .first();
  },
});
