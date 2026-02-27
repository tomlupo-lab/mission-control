import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertStrategy = mutation({
  args: {
    strategyId: v.string(),
    name: v.string(),
    mode: v.string(),
    exchange: v.string(),
    equity: v.optional(v.float64()),
    pnl: v.optional(v.float64()),
    pnlPct: v.optional(v.float64()),
    return1d: v.optional(v.float64()),
    return7d: v.optional(v.float64()),
    return30d: v.optional(v.float64()),
    returnItd: v.optional(v.float64()),
    sharpe: v.optional(v.float64()),
    maxDrawdown: v.optional(v.float64()),
    winRate: v.optional(v.float64()),
    positions: v.optional(v.float64()),
    netExposure: v.optional(v.string()),
    equityCurve: v.optional(v.array(v.object({ date: v.string(), value: v.float64() }))),
    positionBreakdown: v.optional(v.array(v.object({
      symbol: v.string(),
      targetWt: v.optional(v.float64()),
      actualWt: v.optional(v.float64()),
      drift: v.optional(v.float64()),
      notional: v.optional(v.float64()),
      unrealizedPnl: v.optional(v.float64()),
      side: v.optional(v.string()),
    }))),
    reportDate: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tradingStrategies")
      .withIndex("by_strategyId", (q) => q.eq("strategyId", args.strategyId))
      .first();
    const data = { ...args, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("tradingStrategies", data);
    }
  },
});

export const getStrategies = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("tradingStrategies").collect();
    return all.sort((a, b) => {
      if (a.mode !== b.mode) return a.mode === "live" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  },
});

export const upsertTrade = mutation({
  args: {
    strategyId: v.string(),
    date: v.string(),
    timestamp: v.string(),
    symbol: v.string(),
    side: v.string(),
    quantity: v.float64(),
    price: v.float64(),
    notional: v.optional(v.float64()),
    fee: v.optional(v.float64()),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    // Dedup by strategy+date+symbol+side
    const existing = await ctx.db
      .query("tradeLog")
      .withIndex("by_strategy_date", (q) => q.eq("strategyId", args.strategyId).eq("date", args.date))
      .collect();
    const dup = existing.find(
      (t) => t.symbol === args.symbol && t.side === args.side && Math.abs(t.quantity - args.quantity) < 0.0000001
    );
    if (dup) {
      await ctx.db.patch(dup._id, { ...args, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("tradeLog", { ...args, updatedAt: Date.now() });
    }
  },
});

export const getRecentTrades = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("tradeLog").order("desc").take(args.limit ?? 50);
    return all;
  },
});

export const getStrategy = query({
  args: { strategyId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tradingStrategies")
      .withIndex("by_strategyId", (q) => q.eq("strategyId", args.strategyId))
      .first();
  },
});
