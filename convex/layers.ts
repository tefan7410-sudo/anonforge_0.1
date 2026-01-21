import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get layers for a category
export const listByCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("layers")
      .withIndex("by_category", (q) => q.eq("category_id", args.categoryId))
      .collect();
  },
});

// Get all layers for a project
export const listByProject = query({
  args: { projectId: v.id("projects"), includeEffectLayers: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .collect();
    
    const categoryIds = categories.map((c) => c._id);
    
    const allLayers = await Promise.all(
      categoryIds.map((catId) =>
        ctx.db
          .query("layers")
          .withIndex("by_category", (q) => q.eq("category_id", catId))
          .collect()
      )
    );
    
    const layers = allLayers.flat();
    
    if (args.includeEffectLayers) {
      return layers;
    }
    return layers.filter((l) => !l.is_effect_layer);
  },
});

// Create layer
export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    filename: v.string(),
    traitName: v.string(),
    displayName: v.string(),
    storagePath: v.string(),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("layers", {
      category_id: args.categoryId,
      filename: args.filename,
      trait_name: args.traitName,
      display_name: args.displayName,
      storage_path: args.storagePath,
      order_index: args.orderIndex,
      rarity_weight: 100,
      is_effect_layer: false,
    });
  },
});

// Update layer weight
export const updateWeight = mutation({
  args: { id: v.id("layers"), rarityWeight: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { rarity_weight: args.rarityWeight });
  },
});

// Update layer name
export const updateName = mutation({
  args: { id: v.id("layers"), displayName: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { display_name: args.displayName });
  },
});

// Mark as effect layer
export const markAsEffect = mutation({
  args: { id: v.id("layers"), isEffectLayer: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { is_effect_layer: args.isEffectLayer });
  },
});

// Delete layer
export const remove = mutation({
  args: { id: v.id("layers") },
  handler: async (ctx, args) => {
    // Also remove exclusions and effects referencing this layer
    const exclusions = await ctx.db
      .query("layer_exclusions")
      .withIndex("by_layer", (q) => q.eq("layer_id", args.id))
      .collect();
    
    await Promise.all(exclusions.map((e) => ctx.db.delete(e._id)));
    await ctx.db.delete(args.id);
  },
});

// Get layer exclusions
export const getExclusions = query({
  args: { layerId: v.id("layers") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("layer_exclusions")
      .withIndex("by_layer", (q) => q.eq("layer_id", args.layerId))
      .collect();
  },
});

// Create exclusion
export const createExclusion = mutation({
  args: { layerId: v.id("layers"), excludedLayerId: v.id("layers") },
  handler: async (ctx, args) => {
    // Create bidirectional exclusion
    await ctx.db.insert("layer_exclusions", {
      layer_id: args.layerId,
      excluded_layer_id: args.excludedLayerId,
    });
    await ctx.db.insert("layer_exclusions", {
      layer_id: args.excludedLayerId,
      excluded_layer_id: args.layerId,
    });
  },
});

// Delete exclusion
export const deleteExclusion = mutation({
  args: { layerId: v.id("layers"), excludedLayerId: v.id("layers") },
  handler: async (ctx, args) => {
    // Delete both directions
    const exclusions = await ctx.db
      .query("layer_exclusions")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("layer_id"), args.layerId),
            q.eq(q.field("excluded_layer_id"), args.excludedLayerId)
          ),
          q.and(
            q.eq(q.field("layer_id"), args.excludedLayerId),
            q.eq(q.field("excluded_layer_id"), args.layerId)
          )
        )
      )
      .collect();
    
    await Promise.all(exclusions.map((e) => ctx.db.delete(e._id)));
  },
});
