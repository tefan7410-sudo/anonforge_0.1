import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List projects owned by user
export const listByOwner = query({
  args: { ownerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("owner_id", args.ownerId))
      .collect();
  },
});

// Get single project
export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create project
export const create = mutation({
  args: {
    owner_id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    token_prefix: v.string(),
    token_start_number: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", {
      ...args,
      is_public: false,
      settings: {},
    });
  },
});

// Update project
export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    is_public: v.optional(v.boolean()),
    token_prefix: v.optional(v.string()),
    token_start_number: v.optional(v.number()),
    settings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete project
export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get projects shared with user (via project_members)
export const listSharedWith = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("project_members")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();
    
    const projectIds = memberships.map((m) => m.project_id);
    const projects = await Promise.all(
      projectIds.map((id) => ctx.db.get(id))
    );
    
    return projects.filter(Boolean);
  },
});
