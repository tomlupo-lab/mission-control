import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const upsertAgentStatus = mutation({
  args: {
    agentId: v.string(),
    name: v.string(),
    emoji: v.string(),
    lastAction: v.optional(v.string()),
    lastHeartbeat: v.optional(v.number()),
    status: v.string(),
    errorCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agentStatus")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    const data = { ...args, updatedAt: Date.now() };
    if (existing) {
      await ctx.db.patch(existing._id, data);
    } else {
      await ctx.db.insert("agentStatus", data);
    }
  },
});

export const getAgentStatuses = query({
  handler: async (ctx) => {
    return await ctx.db.query("agentStatus").collect();
  },
});
