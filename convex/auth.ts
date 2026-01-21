import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";

// Get current user from auth token
export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    // Find or create profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();
    
    return profile || {
      email: identity.email,
      display_name: identity.name || identity.email?.split("@")[0],
      avatar_url: identity.pictureUrl,
      is_verified_creator: false,
    };
  },
});

// Check if user is authenticated
export const isAuthenticated = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity !== null;
  },
});

// Get user role
export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const role = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("user_id", identity.email || ""))
      .first();
    
    return role?.role || "user";
  },
});

// Create profile on first login
export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }
    
    // Check if profile exists
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();
    
    if (existing) return existing._id;
    
    // Create new profile
    const profileId = await ctx.db.insert("profiles", {
      email: identity.email,
      display_name: identity.name || identity.email.split("@")[0],
      avatar_url: identity.pictureUrl,
      is_verified_creator: false,
    });
    
    // Initialize credits for new user
    await ctx.db.insert("user_credits", {
      user_id: identity.email,
      free_credits: 100,
      purchased_credits: 0,
      next_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    
    return profileId;
  },
});

// Link wallet to profile
export const linkWallet = mutation({
  args: {
    walletAddress: v.string(),
    stakeAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }
    
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    await ctx.db.patch(profile._id, {
      wallet_address: args.walletAddress,
      stake_address: args.stakeAddress,
    });
    
    return true;
  },
});

// Accept terms of service
export const acceptTerms = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }
    
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!profile) {
      throw new Error("Profile not found");
    }
    
    await ctx.db.patch(profile._id, {
      accepted_terms_at: new Date().toISOString(),
    });
    
    return true;
  },
});
