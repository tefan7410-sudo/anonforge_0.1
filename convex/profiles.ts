import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get profile by user ID (from auth)
export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), args.userId))
      .first();
    return profile;
  },
});

// Get current user's profile
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    return profile;
  },
});

// Create or update profile
export const upsert = mutation({
  args: {
    email: v.string(),
    display_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    twitter_handle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        display_name: args.display_name,
        avatar_url: args.avatar_url,
        twitter_handle: args.twitter_handle,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("profiles", {
        email: args.email,
        display_name: args.display_name,
        avatar_url: args.avatar_url,
        twitter_handle: args.twitter_handle,
        is_verified_creator: false,
      });
    }
  },
});

// Update profile
export const update = mutation({
  args: {
    id: v.id("profiles"),
    display_name: v.optional(v.string()),
    avatar_url: v.optional(v.string()),
    twitter_handle: v.optional(v.string()),
    wallet_address: v.optional(v.string()),
    stake_address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Check if profile is incomplete (wallet-only registration)
export const isIncomplete = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email")
      .filter((q) => q.eq(q.field("email"), args.userId))
      .first();
    
    if (!profile) return false;
    
    const isWalletUser = profile.stake_address && profile.email?.endsWith('@wallet.anonforge.com');
    const hasAutoDisplayName = !profile.display_name || profile.display_name.startsWith('Wallet ');
    const hasNotAcceptedTerms = !profile.accepted_terms_at;
    
    return isWalletUser && (hasAutoDisplayName || hasNotAcceptedTerms);
  },
});
