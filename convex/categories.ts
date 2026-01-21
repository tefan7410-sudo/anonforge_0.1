import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get categories for a project
export const listByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .collect();
  },
});

// Create category
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    displayName: v.string(),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", {
      project_id: args.projectId,
      name: args.name,
      display_name: args.displayName,
      order_index: args.orderIndex,
    });
  },
});

// Update category
export const update = mutation({
  args: {
    id: v.id("categories"),
    displayName: v.optional(v.string()),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const patchData: Record<string, unknown> = {};
    if (updates.displayName !== undefined) patchData.display_name = updates.displayName;
    if (updates.orderIndex !== undefined) patchData.order_index = updates.orderIndex;
    await ctx.db.patch(id, patchData);
  },
});

// Delete category
export const remove = mutation({
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    // Delete all layers in this category first
    const layers = await ctx.db
      .query("layers")
      .withIndex("by_category", (q) => q.eq("category_id", args.id))
      .collect();
    
    await Promise.all(layers.map((l) => ctx.db.delete(l._id)));
    await ctx.db.delete(args.id);
  },
});

// Reorder categories
export const reorder = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("categories"),
      orderIndex: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.updates.map((u) => ctx.db.patch(u.id, { order_index: u.orderIndex }))
    );
  },
});
