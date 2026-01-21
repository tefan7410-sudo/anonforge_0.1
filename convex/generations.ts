import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get generations for a project
export const listByProject = query({
  args: { projectId: v.id("projects"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("generations")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .order("desc")
      .take(limit);
  },
});

// Get single generation
export const get = query({
  args: { id: v.id("generations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create generation
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    count: v.number(),
    settings: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generations", {
      project_id: args.projectId,
      user_id: args.userId,
      name: args.name,
      count: args.count,
      settings: args.settings,
      status: "pending",
      progress: 0,
    });
  },
});

// Update generation status
export const updateStatus = mutation({
  args: {
    id: v.id("generations"),
    status: v.string(),
    progress: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    outputZipUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const patchData: Record<string, unknown> = {
      status: updates.status,
    };
    if (updates.progress !== undefined) patchData.progress = updates.progress;
    if (updates.errorMessage !== undefined) patchData.error_message = updates.errorMessage;
    if (updates.outputZipUrl !== undefined) patchData.output_zip_url = updates.outputZipUrl;
    if (updates.status === "completed") patchData.completed_at = new Date().toISOString();
    
    await ctx.db.patch(id, patchData);
  },
});

// Save generation results
export const saveResults = mutation({
  args: {
    id: v.id("generations"),
    images: v.array(v.object({
      filename: v.string(),
      url: v.string(),
      traits: v.any(),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      generated_images: args.images,
      status: "completed",
      completed_at: new Date().toISOString(),
      progress: 100,
    });
  },
});

// Delete generation
export const remove = mutation({
  args: { id: v.id("generations") },
  handler: async (ctx, args) => {
    // Delete associated comments
    const comments = await ctx.db
      .query("generation_comments")
      .withIndex("by_generation", (q) => q.eq("generation_id", args.id))
      .collect();
    
    await Promise.all(comments.map((c) => ctx.db.delete(c._id)));
    await ctx.db.delete(args.id);
  },
});

// Get comments for generation
export const getComments = query({
  args: { generationId: v.id("generations") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("generation_comments")
      .withIndex("by_generation", (q) => q.eq("generation_id", args.generationId))
      .order("desc")
      .collect();
    
    // Fetch user info for each comment
    const result = await Promise.all(
      comments.map(async (comment) => {
        const profile = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("email"), comment.user_id))
          .first();
        return {
          ...comment,
          user: profile ? {
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          } : null,
        };
      })
    );
    
    return result;
  },
});

// Add comment to generation
export const addComment = mutation({
  args: {
    generationId: v.id("generations"),
    userId: v.string(),
    content: v.string(),
    parentId: v.optional(v.id("generation_comments")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("generation_comments", {
      generation_id: args.generationId,
      user_id: args.userId,
      content: args.content,
      parent_id: args.parentId,
    });
  },
});
