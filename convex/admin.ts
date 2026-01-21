import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Check if user is admin
export const isAdmin = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const role = await ctx.db
      .query("user_roles")
      .filter((q) =>
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.eq(q.field("role"), "admin")
        )
      )
      .first();
    
    return role !== null;
  },
});

// Get all users with roles
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    const roles = await ctx.db.query("user_roles").collect();
    
    return profiles.map((profile) => {
      const userRole = roles.find((r) => r.user_id === profile.email);
      return {
        ...profile,
        role: userRole?.role || "user",
      };
    });
  },
});

// Get pending verification requests
export const getPendingVerifications = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("verification_requests")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    
    const result = await Promise.all(
      requests.map(async (req) => {
        const profile = await ctx.db
          .query("profiles")
          .filter((q) => q.eq(q.field("email"), req.user_id))
          .first();
        return { ...req, profile };
      })
    );
    
    return result;
  },
});

// Approve verification
export const approveVerification = mutation({
  args: { requestId: v.id("verification_requests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Verification request not found");
    
    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewed_at: new Date().toISOString(),
    });
    
    // Update user profile
    const profile = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("email"), request.user_id))
      .first();
    
    if (profile) {
      await ctx.db.patch(profile._id, { is_verified_creator: true });
    }
  },
});

// Reject verification
export const rejectVerification = mutation({
  args: { requestId: v.id("verification_requests"), reason: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.requestId, {
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      admin_notes: args.reason,
    });
  },
});

// Get bug reports
export const getBugReports = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("bug_reports")
        .filter((q) => q.eq(q.field("status"), args.status))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("bug_reports").order("desc").collect();
  },
});

// Update bug report status
export const updateBugStatus = mutation({
  args: {
    id: v.id("bug_reports"),
    status: v.string(),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      admin_notes: args.adminNotes,
      updated_at: new Date().toISOString(),
    });
  },
});

// Get all marketing requests for admin
export const getMarketingRequests = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db
      .query("marketing_requests")
      .order("desc")
      .collect();
    
    const result = await Promise.all(
      requests.map(async (req) => {
        const project = await ctx.db.get(req.project_id);
        return { ...req, project };
      })
    );
    
    return result;
  },
});

// Get hero backgrounds
export const getHeroBackgrounds = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("hero_backgrounds")
      .order("asc")
      .collect();
  },
});

// Add hero background
export const addHeroBackground = mutation({
  args: { imageUrl: v.string(), storagePath: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("hero_backgrounds").collect();
    const maxOrder = Math.max(...existing.map((h) => h.display_order || 0), -1);
    
    return await ctx.db.insert("hero_backgrounds", {
      image_url: args.imageUrl,
      storage_path: args.storagePath,
      is_active: true,
      display_order: maxOrder + 1,
    });
  },
});

// Toggle hero background active state
export const toggleHeroBackground = mutation({
  args: { id: v.id("hero_backgrounds"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { is_active: args.isActive });
  },
});

// Delete hero background
export const deleteHeroBackground = mutation({
  args: { id: v.id("hero_backgrounds") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Get art fund stats
export const getArtFundStats = query({
  args: {},
  handler: async (ctx) => {
    const donations = await ctx.db.query("art_fund_donations").collect();
    const pendingPayouts = await ctx.db
      .query("art_fund_payouts")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    
    const totalDonated = donations.reduce((sum, d) => sum + (d.amount_ada || 0), 0);
    const totalPayouts = pendingPayouts.reduce((sum, p) => sum + (p.amount_ada || 0), 0);
    
    return {
      total_donated: totalDonated,
      pending_payouts: totalPayouts,
      balance: totalDonated - totalPayouts,
      donation_count: donations.length,
    };
  },
});
