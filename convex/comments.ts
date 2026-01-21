import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getViewer } from "./auth";

// List comments for a generation
export const listByGeneration = query({
  args: { generationId: v.id("generations") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("generation_comments")
      .withIndex("by_generation", (q) => q.eq("generation_id", args.generationId))
      .order("asc")
      .collect();
    
    // Fetch user profiles for each comment
    const result = await Promise.all(
      comments.map(async (comment) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_email", (q) => q.eq("email", comment.user_id))
          .first();
        
        return {
          ...comment,
          user: profile ? {
            display_name: profile.display_name,
            email: profile.email,
            avatar_url: profile.avatar_url,
          } : null,
        };
      })
    );
    
    return result;
  },
});

// Add a comment
export const addComment = mutation({
  args: {
    generationId: v.id("generations"),
    content: v.string(),
    parentId: v.optional(v.id("generation_comments")),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    return await ctx.db.insert("generation_comments", {
      generation_id: args.generationId,
      user_id: viewer.userId,
      content: args.content,
      parent_id: args.parentId,
    });
  },
});

// Delete a comment
export const deleteComment = mutation({
  args: { commentId: v.id("generation_comments") },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("Comment not found");
    
    // Only allow deletion by comment author
    if (comment.user_id !== viewer.userId) {
      throw new Error("Unauthorized");
    }
    
    await ctx.db.delete(args.commentId);
    
    return { success: true };
  },
});

// Get comment counts for multiple generations
export const getCommentCounts = query({
  args: { generationIds: v.array(v.id("generations")) },
  handler: async (ctx, args) => {
    const counts: Record<string, number> = {};
    
    await Promise.all(
      args.generationIds.map(async (genId) => {
        const comments = await ctx.db
          .query("generation_comments")
          .withIndex("by_generation", (q) => q.eq("generation_id", genId))
          .collect();
        
        counts[genId] = comments.length;
      })
    );
    
    return counts;
  },
});
