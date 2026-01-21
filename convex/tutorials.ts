import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getViewer } from "./auth";

// Get user's tutorial progress
export const getProgress = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;
    
    const progress = await ctx.db
      .query("tutorial_progress")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .first();
    
    return progress;
  },
});

// Update tutorial progress
export const updateProgress = mutation({
  args: {
    currentStep: v.number(),
    tutorialEnabled: v.optional(v.boolean()),
    completedAt: v.optional(v.string()),
    skippedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    const existing = await ctx.db
      .query("tutorial_progress")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        current_step: args.currentStep,
        tutorial_enabled: args.tutorialEnabled !== undefined ? args.tutorialEnabled : existing.tutorial_enabled,
        completed_at: args.completedAt !== undefined ? args.completedAt : existing.completed_at,
        skipped_at: args.skippedAt !== undefined ? args.skippedAt : existing.skipped_at,
        updated_at: new Date().toISOString(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("tutorial_progress", {
        user_id: viewer.userId,
        current_step: args.currentStep,
        tutorial_enabled: args.tutorialEnabled !== undefined ? args.tutorialEnabled : true,
        completed_at: args.completedAt,
        skipped_at: args.skippedAt,
      });
    }
  },
});

// Reset tutorial progress
export const resetProgress = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    const existing = await ctx.db
      .query("tutorial_progress")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        current_step: 1,
        tutorial_enabled: true,
        completed_at: undefined,
        skipped_at: undefined,
        updated_at: new Date().toISOString(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("tutorial_progress", {
        user_id: viewer.userId,
        current_step: 1,
        tutorial_enabled: true,
      });
    }
  },
});

// Start tutorial
export const startTutorial = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    const existing = await ctx.db
      .query("tutorial_progress")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        tutorial_enabled: true,
        current_step: 1,
        completed_at: undefined,
        skipped_at: undefined,
        updated_at: new Date().toISOString(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("tutorial_progress", {
        user_id: viewer.userId,
        tutorial_enabled: true,
        current_step: 1,
      });
    }
  },
});

// Skip tutorial
export const skipTutorial = mutation({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    const existing = await ctx.db
      .query("tutorial_progress")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        tutorial_enabled: false,
        skipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("tutorial_progress", {
        user_id: viewer.userId,
        tutorial_enabled: false,
        skipped_at: new Date().toISOString(),
        current_step: 0,
      });
    }
  },
});
