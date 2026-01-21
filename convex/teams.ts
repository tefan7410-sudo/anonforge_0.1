import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getViewer } from "./auth";

// List team members for a project
export const listMembers = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("project_members")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .collect();
    
    // Fetch profiles for each member
    const result = await Promise.all(
      members.map(async (member) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_email", (q) => q.eq("email", member.user_id))
          .first();
        
        return {
          ...member,
          profile: profile ? {
            email: profile.email,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
          } : null,
        };
      })
    );
    
    return result;
  },
});

// Invite a member to a project
export const inviteMember = mutation({
  args: {
    projectId: v.id("projects"),
    email: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    // Check project ownership or membership
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    const isOwner = project.owner_id === viewer.userId;
    const isMember = await ctx.db
      .query("project_members")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .filter((q) => q.eq(q.field("user_id"), viewer.userId))
      .first();
    
    if (!isOwner && !isMember) {
      throw new Error("Unauthorized");
    }
    
    // Check for existing pending invitation
    const existingInvitation = await ctx.db
      .query("project_invitations")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .filter((q) => 
        q.and(
          q.eq(q.field("email"), args.email),
          q.eq(q.field("status"), "pending")
        )
      )
      .first();
    
    if (existingInvitation) {
      throw new Error("An invitation is already pending for this email");
    }
    
    // Check if user is already a member
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (profile) {
      const existingMember = await ctx.db
        .query("project_members")
        .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
        .filter((q) => q.eq(q.field("user_id"), profile.email))
        .first();
      
      if (existingMember) {
        throw new Error("This user is already a member of this project");
      }
    }
    
    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
    
    return await ctx.db.insert("project_invitations", {
      project_id: args.projectId,
      email: args.email,
      role: args.role,
      status: "pending",
      invited_by: viewer.userId,
      expires_at: expiresAt.toISOString(),
    });
  },
});

// List invitations for a project
export const listInvitations = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("project_invitations")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
  },
});

// Accept an invitation
export const acceptInvitation = mutation({
  args: { invitationId: v.id("project_invitations") },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    
    // Check if invitation is expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      await ctx.db.patch(args.invitationId, { status: "expired" });
      throw new Error("Invitation has expired");
    }
    
    // Check if email matches
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", viewer.userId))
      .first();
    
    if (!profile || profile.email !== invitation.email) {
      throw new Error("This invitation is not for your account");
    }
    
    // Check if already a member
    const existingMember = await ctx.db
      .query("project_members")
      .withIndex("by_project", (q) => q.eq("project_id", invitation.project_id))
      .filter((q) => q.eq(q.field("user_id"), viewer.userId))
      .first();
    
    if (existingMember) {
      // Mark invitation as accepted anyway
      await ctx.db.patch(args.invitationId, { status: "accepted" });
      return { success: true };
    }
    
    // Add as member
    await ctx.db.insert("project_members", {
      project_id: invitation.project_id,
      user_id: viewer.userId,
      role: invitation.role,
      invited_by: invitation.invited_by,
      accepted_at: new Date().toISOString(),
    });
    
    // Update invitation status
    await ctx.db.patch(args.invitationId, { status: "accepted" });
    
    return { success: true };
  },
});

// Decline an invitation
export const declineInvitation = mutation({
  args: { invitationId: v.id("project_invitations") },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    
    // Check if email matches
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", viewer.userId))
      .first();
    
    if (!profile || profile.email !== invitation.email) {
      throw new Error("This invitation is not for your account");
    }
    
    await ctx.db.patch(args.invitationId, { status: "declined" });
    
    return { success: true };
  },
});

// Remove a team member
export const removeMember = mutation({
  args: {
    memberId: v.id("project_members"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    // Check project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    if (project.owner_id !== viewer.userId) {
      throw new Error("Only project owner can remove members");
    }
    
    const member = await ctx.db.get(args.memberId);
    if (!member) throw new Error("Member not found");
    
    // Can't remove owner
    if (member.user_id === project.owner_id) {
      throw new Error("Cannot remove project owner");
    }
    
    await ctx.db.delete(args.memberId);
    
    return { success: true };
  },
});

// Update member role
export const updateRole = mutation({
  args: {
    memberId: v.id("project_members"),
    role: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    // Check project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    if (project.owner_id !== viewer.userId) {
      throw new Error("Only project owner can update roles");
    }
    
    await ctx.db.patch(args.memberId, { role: args.role });
    
    return { success: true };
  },
});

// Cancel an invitation
export const cancelInvitation = mutation({
  args: {
    invitationId: v.id("project_invitations"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    if (!viewer) throw new Error("Not authenticated");
    
    // Check project ownership
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    
    if (project.owner_id !== viewer.userId) {
      throw new Error("Only project owner can cancel invitations");
    }
    
    await ctx.db.delete(args.invitationId);
    
    return { success: true };
  },
});
