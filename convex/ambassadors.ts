import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getViewer, getAdminViewer } from "./auth";

// List all ambassador applications with optional status filter
export const listApplications = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("ambassador_applications");
    
    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else {
      query = query.withIndex("by_status");
    }
    
    const applications = await query.collect();
    
    // Fetch profiles for each application
    const result = await Promise.all(
      applications.map(async (app) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_email", (q) => q.eq("email", app.user_id))
          .first();
        
        return {
          ...app,
          profile: profile ? {
            _id: profile._id,
            email: profile.email,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          } : undefined,
        };
      })
    );
    
    return result;
  },
});

// Get current user's ambassador application
export const getMyApplication = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return null;
    
    const application = await ctx.db
      .query("ambassador_applications")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .first();
    
    return application;
  },
});

// Submit new ambassador application
export const submitApplication = mutation({
  args: {
    twitterUrl: v.optional(v.string()),
    experience: v.optional(v.string()),
    motivation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    // Check if user already has an application
    const existing = await ctx.db
      .query("ambassador_applications")
      .withIndex("by_user", (q) => q.eq("user_id", viewer.userId))
      .first();
    
    if (existing) {
      throw new Error("You already have a pending application");
    }
    
    return await ctx.db.insert("ambassador_applications", {
      user_id: viewer.userId,
      status: "pending",
      twitter_url: args.twitterUrl,
      experience: args.experience,
      motivation: args.motivation,
    });
  },
});

// Approve ambassador application (admin only)
export const approveApplication = mutation({
  args: {
    applicationId: v.id("ambassador_applications"),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminViewer(ctx);
    if (!admin) throw new Error("Unauthorized");
    
    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");
    
    // Update application status
    await ctx.db.patch(args.applicationId, {
      status: "approved",
      reviewed_at: new Date().toISOString(),
      admin_notes: "Approved by admin",
    });
    
    // Add ambassador role to user_roles
    const existingRole = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("user_id", application.user_id))
      .filter((q) => q.eq(q.field("role"), "ambassador"))
      .first();
    
    if (!existingRole) {
      await ctx.db.insert("user_roles", {
        user_id: application.user_id,
        role: "ambassador",
      });
    }
    
    return { success: true };
  },
});

// Reject ambassador application (admin only)
export const rejectApplication = mutation({
  args: {
    applicationId: v.id("ambassador_applications"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminViewer(ctx);
    if (!admin) throw new Error("Unauthorized");
    
    const application = await ctx.db.get(args.applicationId);
    if (!application) throw new Error("Application not found");
    
    await ctx.db.patch(args.applicationId, {
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      admin_notes: args.reason,
    });
    
    return { success: true };
  },
});

// List all approved ambassadors
export const listAmbassadors = query({
  args: {},
  handler: async (ctx) => {
    // Get all users with ambassador role
    const roles = await ctx.db
      .query("user_roles")
      .filter((q) => q.eq(q.field("role"), "ambassador"))
      .collect();
    
    // Fetch profiles for each ambassador
    const result = await Promise.all(
      roles.map(async (role) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_email", (q) => q.eq("email", role.user_id))
          .first();
        
        return {
          _id: role._id,
          user_id: role.user_id,
          role: role.role,
          profile: profile ? {
            _id: profile._id,
            email: profile.email,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          } : undefined,
        };
      })
    );
    
    return result;
  },
});

// Remove ambassador role (admin only)
export const removeAmbassadorRole = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminViewer(ctx);
    if (!admin) throw new Error("Unauthorized");
    
    const role = await ctx.db
      .query("user_roles")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .filter((q) => q.eq(q.field("role"), "ambassador"))
      .first();
    
    if (role) {
      await ctx.db.delete(role._id);
    }
    
    return { success: true };
  },
});
