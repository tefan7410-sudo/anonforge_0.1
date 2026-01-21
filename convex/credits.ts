import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user credits
export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .first();
    
    if (!credits) {
      // Return default credits for new users
      return {
        free_credits: 100,
        purchased_credits: 0,
        next_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    
    return credits;
  },
});

// Initialize credits for new user
export const initialize = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .first();
    
    if (existing) return existing._id;
    
    return await ctx.db.insert("user_credits", {
      user_id: args.userId,
      free_credits: 100,
      purchased_credits: 0,
      next_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  },
});

// Deduct credits
export const deduct = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    description: v.optional(v.string()),
    generationId: v.optional(v.string()),
    generationType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .first();
    
    if (!credits) {
      throw new Error("User credits not found");
    }
    
    const totalCredits = credits.free_credits + credits.purchased_credits;
    if (totalCredits < args.amount) {
      throw new Error("Insufficient credits");
    }
    
    // Deduct from free credits first, then purchased
    let remaining = args.amount;
    let newFree = credits.free_credits;
    let newPurchased = credits.purchased_credits;
    
    if (newFree >= remaining) {
      newFree -= remaining;
      remaining = 0;
    } else {
      remaining -= newFree;
      newFree = 0;
      newPurchased -= remaining;
    }
    
    await ctx.db.patch(credits._id, {
      free_credits: newFree,
      purchased_credits: newPurchased,
    });
    
    // Log transaction
    await ctx.db.insert("credit_transactions", {
      user_id: args.userId,
      amount: -args.amount,
      transaction_type: "deduction",
      description: args.description,
      generation_id: args.generationId,
      generation_type: args.generationType,
    });
    
    return true;
  },
});

// Add purchased credits
export const addPurchased = mutation({
  args: {
    userId: v.string(),
    amount: v.number(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const credits = await ctx.db
      .query("user_credits")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .first();
    
    if (!credits) {
      // Create new credits record
      await ctx.db.insert("user_credits", {
        user_id: args.userId,
        free_credits: 100,
        purchased_credits: args.amount,
        next_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } else {
      await ctx.db.patch(credits._id, {
        purchased_credits: credits.purchased_credits + args.amount,
      });
    }
    
    // Log transaction
    await ctx.db.insert("credit_transactions", {
      user_id: args.userId,
      amount: args.amount,
      transaction_type: "purchase",
      description: args.description,
    });
  },
});

// Get credit transactions
export const getTransactions = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("credit_transactions")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .order("desc")
      .take(50);
  },
});
