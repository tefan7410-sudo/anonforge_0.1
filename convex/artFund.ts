import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getViewer, getAdminViewer } from "./auth";

// Get art fund sources
export const getSources = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("art_fund_sources")
      .order("desc")
      .collect();
  },
});

// Get art fund settings
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("art_fund_settings")
      .first();
    
    return settings;
  },
});

// Get donation history
export const getDonations = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("art_fund_donations")
      .order("desc")
      .take(limit);
  },
});

// Submit donation (may need action for blockchain verification)
export const submitDonation = mutation({
  args: {
    amountAda: v.number(),
    txHash: v.optional(v.string()),
    message: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    const userId = viewer?.userId;
    
    return await ctx.db.insert("art_fund_donations", {
      user_id: userId,
      amount_ada: args.amountAda,
      tx_hash: args.txHash,
      message: args.message,
      is_anonymous: args.isAnonymous || false,
    });
  },
});

// Admin: Add fund source
export const addSource = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    amountAda: v.number(),
    category: v.union(v.literal("fees"), v.literal("special_sale"), v.literal("donation"), v.literal("other")),
    sourceDate: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminViewer(ctx);
    if (!admin) throw new Error("Unauthorized");
    
    return await ctx.db.insert("art_fund_sources", {
      name: args.name,
      description: args.description,
      amount_ada: args.amountAda,
      category: args.category,
      source_date: args.sourceDate,
      is_active: true,
    });
  },
});

// Admin: Update fund source
export const updateSource = mutation({
  args: {
    id: v.id("art_fund_sources"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    amountAda: v.optional(v.number()),
    category: v.optional(v.union(v.literal("fees"), v.literal("special_sale"), v.literal("donation"), v.literal("other"))),
    sourceDate: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminViewer(ctx);
    if (!admin) throw new Error("Unauthorized");
    
    const { id, ...updates } = args;
    const patchData: Record<string, unknown> = {};
    
    if (updates.name !== undefined) patchData.name = updates.name;
    if (updates.description !== undefined) patchData.description = updates.description;
    if (updates.amountAda !== undefined) patchData.amount_ada = updates.amountAda;
    if (updates.category !== undefined) patchData.category = updates.category;
    if (updates.sourceDate !== undefined) patchData.source_date = updates.sourceDate;
    if (updates.isActive !== undefined) patchData.is_active = updates.isActive;
    
    await ctx.db.patch(id, patchData);
    
    return { success: true };
  },
});

// Admin: Delete fund source
export const deleteSource = mutation({
  args: { id: v.id("art_fund_sources") },
  handler: async (ctx, args) => {
    const admin = await getAdminViewer(ctx);
    if (!admin) throw new Error("Unauthorized");
    
    await ctx.db.delete(args.id);
    
    return { success: true };
  },
});

// Admin: Update art fund settings
export const updateSettings = mutation({
  args: {
    walletAddress: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminViewer(ctx);
    if (!admin) throw new Error("Unauthorized");
    
    const existing = await ctx.db.query("art_fund_settings").first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        wallet_address: args.walletAddress,
        description: args.description,
        updated_at: new Date().toISOString(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("art_fund_settings", {
        wallet_address: args.walletAddress,
        description: args.description,
      });
    }
  },
});
