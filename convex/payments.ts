import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getViewer } from "./auth";

// Create payment intent
export const createIntent = mutation({
  args: {
    type: v.string(),
    amountAda: v.number(),
    amountLovelace: v.number(),
    paymentAddress: v.string(),
    expiresAt: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    return await ctx.db.insert("payment_intents", {
      user_id: viewer.userId,
      type: args.type,
      amount_ada: args.amountAda,
      amount_lovelace: args.amountLovelace,
      payment_address: args.paymentAddress,
      status: "pending",
      expires_at: args.expiresAt,
      metadata: args.metadata,
    });
  },
});

// Get payment intent by ID
export const getIntent = query({
  args: { id: v.id("payment_intents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get payment intent by address
export const getIntentByAddress = query({
  args: { address: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payment_intents")
      .withIndex("by_address", (q) => q.eq("payment_address", args.address))
      .first();
  },
});

// Update payment status
export const updateStatus = mutation({
  args: {
    id: v.id("payment_intents"),
    status: v.string(),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patchData: Record<string, unknown> = {
      status: args.status,
    };
    
    if (args.txHash) {
      patchData.tx_hash = args.txHash;
    }
    
    await ctx.db.patch(args.id, patchData);
    
    return { success: true };
  },
});

// List payment intents for user
export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];
    
    return await ctx.db
      .query("payment_intents")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .order("desc")
      .collect();
  },
});

// Get pending payments for user
export const getPendingPayments = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];
    
    const now = new Date().toISOString();
    
    return await ctx.db
      .query("payment_intents")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "pending"),
          q.gt(q.field("expires_at"), now)
        )
      )
      .order("desc")
      .collect();
  },
});

// Cancel payment intent
export const cancelIntent = mutation({
  args: { id: v.id("payment_intents") },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    const intent = await ctx.db.get(args.id);
    if (!intent) throw new Error("Payment intent not found");
    
    if (intent.user_id !== viewer.userId) {
      throw new Error("Unauthorized");
    }
    
    if (intent.status !== "pending") {
      throw new Error("Can only cancel pending payments");
    }
    
    await ctx.db.patch(args.id, { status: "cancelled" });
    
    return { success: true };
  },
});
