import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getViewer } from "./auth";

// Get current user's verification request
export const getMyRequest = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;
    
    const request = await ctx.db
      .query("verification_requests")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .first();
    
    return request;
  },
});

// Submit new verification request
export const submitRequest = mutation({
  args: {
    twitterHandle: v.optional(v.string()),
    bio: v.optional(v.string()),
    portfolioLinks: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    // Check if user already has a request
    const existing = await ctx.db
      .query("verification_requests")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .first();
    
    if (existing && existing.status === "pending") {
      throw new Error("You already have a pending verification request");
    }
    
    // Create or update request
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "pending",
        twitter_url: args.twitterHandle,
        description: args.bio,
        portfolio_url: args.portfolioLinks?.[0],
        reviewed_at: undefined,
        admin_notes: undefined,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("verification_requests", {
        user_id: viewer.userId,
        status: "pending",
        twitter_url: args.twitterHandle,
        description: args.bio,
        portfolio_url: args.portfolioLinks?.[0],
      });
    }
  },
});
