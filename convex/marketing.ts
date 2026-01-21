import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get active marketing (for landing page display)
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    // Find active marketing request
    const requests = await ctx.db
      .query("marketing_requests")
      .filter((q) => q.eq(q.field("status"), "active"))
      .take(1);
    
    if (requests.length === 0) return null;
    
    const request = requests[0];
    
    // Get project
    const project = await ctx.db.get(request.project_id);
    if (!project) return null;
    
    // Get product page
    const productPage = await ctx.db
      .query("product_pages")
      .withIndex("by_project", (q) => q.eq("project_id", request.project_id))
      .first();
    
    return {
      ...request,
      project: { id: project._id, name: project.name },
      product_page: productPage ? {
        logo_url: productPage.logo_url,
        banner_url: productPage.banner_url,
        tagline: productPage.tagline,
      } : null,
    };
  },
});

// Get marketing bookings (for calendar)
export const getBookings = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    return await ctx.db
      .query("marketing_requests")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("status"), "pending"),
            q.eq(q.field("status"), "approved"),
            q.eq(q.field("status"), "active"),
            q.eq(q.field("status"), "paid")
          ),
          q.gte(q.field("end_date"), now)
        )
      )
      .collect();
  },
});

// Get marketing request for a project
export const getByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketing_requests")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .order("desc")
      .first();
  },
});

// Create marketing request
export const create = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    durationDays: v.number(),
    startDate: v.string(),
    endDate: v.string(),
    priceAda: v.number(),
    message: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("marketing_requests", {
      project_id: args.projectId,
      user_id: args.userId,
      status: "pending",
      duration_days: args.durationDays,
      start_date: args.startDate,
      end_date: args.endDate,
      price_ada: args.priceAda,
      message: args.message,
      hero_image_url: args.heroImageUrl,
    });
  },
});

// Approve marketing request (admin)
export const approve = mutation({
  args: { id: v.id("marketing_requests") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "approved",
      approved_at: new Date().toISOString(),
    });
  },
});

// Reject marketing request (admin)
export const reject = mutation({
  args: { id: v.id("marketing_requests"), reason: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "rejected",
      admin_notes: args.reason,
    });
  },
});

// Activate marketing (after payment)
export const activate = mutation({
  args: { id: v.id("marketing_requests") },
  handler: async (ctx, args) => {
    const request = await ctx.db.get(args.id);
    if (!request) throw new Error("Marketing request not found");
    
    await ctx.db.patch(args.id, {
      status: "active",
      payment_status: "completed",
    });
    
    // Update product page to mark as featured
    const productPage = await ctx.db
      .query("product_pages")
      .withIndex("by_project", (q) => q.eq("project_id", request.project_id))
      .first();
    
    if (productPage) {
      await ctx.db.patch(productPage._id, {
        is_featured: true,
        featured_until: request.end_date,
      });
    }
  },
});
