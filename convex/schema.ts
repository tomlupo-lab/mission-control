import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  healthSnapshots: defineTable({
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
    updatedAt: v.number(),
  }).index("by_date", ["date"]),

  activities: defineTable({
    date: v.string(),
    type: v.string(),
    name: v.string(),
    duration: v.optional(v.number()),
    calories: v.optional(v.number()),
    distance: v.optional(v.number()),
    source: v.optional(v.string()),
  }).index("by_date", ["date"]),

  tesCharacter: defineTable({
    level: v.number(),
    xp: v.number(),
    totalXp: v.number(),
    streaks: v.any(),
    badges: v.array(v.string()),
    domains: v.any(),
    className: v.optional(v.string()),
    totalEvents: v.optional(v.number()),
    updatedAt: v.number(),
  }),

  zioloTracker: defineTable({
    currentStreak: v.number(),
    lastUseDate: v.string(),
    monthlyUseDays: v.number(),
    monthlyGoal: v.number(),
    yearlyUseDays: v.number(),
    yearlyGoal: v.number(),
    updatedAt: v.number(),
  }),

  tradingStrategies: defineTable({
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
    updatedAt: v.float64(),
  }).index("by_strategyId", ["strategyId"]),

  cronJobs: defineTable({
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
    updatedAt: v.number(),
  }).index("by_jobId", ["jobId"]),

  mealLog: defineTable({
    date: v.string(),
    mealType: v.string(),
    name: v.string(),
    kcal: v.number(),
    protein: v.number(),
    carbs: v.number(),
    fat: v.number(),
    satFat: v.optional(v.number()),
    fiber: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_date", ["date"]),

  mealPlan: defineTable({
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
    updatedAt: v.number(),
  }).index("by_weekLabel", ["weekLabel"]),

  agentStatus: defineTable({
    agentId: v.string(),
    name: v.string(),
    emoji: v.string(),
    lastAction: v.optional(v.string()),
    lastHeartbeat: v.optional(v.number()),
    status: v.string(),
    errorCount: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_agentId", ["agentId"]),

  weeklyReports: defineTable({
    domain: v.string(),
    reportDate: v.string(),
    title: v.string(),
    summary: v.optional(v.string()),
    sourcePath: v.optional(v.string()),
    content: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_domain_date", ["domain", "reportDate"])
    .index("by_reportDate", ["reportDate"]),

  tradeLog: defineTable({
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
    updatedAt: v.number(),
  })
    .index("by_date", ["date"])
    .index("by_strategy_date", ["strategyId", "date"]),

  reports: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_reportId", ["reportId"])
    .index("by_agent_date", ["agent", "date"])
    .index("by_type_date", ["reportType", "date"])
    .index("by_date", ["date"]),
});
