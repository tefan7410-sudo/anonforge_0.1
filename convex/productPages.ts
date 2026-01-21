import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get product page by project
export const getByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("product_pages")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .first();
  },
});

// Get product page by slug
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("product_pages")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// Get live product pages (for marketplace)
export const listLive = query({
  args: {},
  handler: async (ctx) => {
    const pages = await ctx.db
      .query("product_pages")
      .filter((q) =>
        q.and(
          q.eq(q.field("is_live"), true),
          q.neq(q.field("is_hidden"), true)
        )
      )
      .collect();
    
    // Fetch project info for each page
    const result = await Promise.all(
      pages.map(async (page) => {
        const project = await ctx.db.get(page.project_id);
        return { ...page, project };
      })
    );
    
    return result.filter((r) => r.project !== null);
  },
});

// Get featured product pages
export const listFeatured = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    const pages = await ctx.db
      .query("product_pages")
      .filter((q) =>
        q.and(
          q.eq(q.field("is_featured"), true),
          q.eq(q.field("is_live"), true),
          q.or(
            q.eq(q.field("featured_until"), null),
            q.gte(q.field("featured_until"), now)
          )
        )
      )
      .collect();
    
    const result = await Promise.all(
      pages.map(async (page) => {
        const project = await ctx.db.get(page.project_id);
        return { ...page, project };
      })
    );
    
    return result.filter((r) => r.project !== null);
  },
});

// Create or update product page
export const upsert = mutation({
  args: {
    projectId: v.id("projects"),
    slug: v.optional(v.string()),
    tagline: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    collectionType: v.optional(v.string()),
    maxSupply: v.optional(v.number()),
    twitterUrl: v.optional(v.string()),
    discordUrl: v.optional(v.string()),
    websiteUrl: v.optional(v.string()),
    founderName: v.optional(v.string()),
    founderBio: v.optional(v.string()),
    founderPfpUrl: v.optional(v.string()),
    founderTwitter: v.optional(v.string()),
    buyButtonEnabled: v.optional(v.boolean()),
    buyButtonText: v.optional(v.string()),
    buyButtonLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("product_pages")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .first();
    
    const data = {
      slug: args.slug,
      tagline: args.tagline,
      logo_url: args.logoUrl,
      banner_url: args.bannerUrl,
      collection_type: args.collectionType,
      max_supply: args.maxSupply,
      twitter_url: args.twitterUrl,
      discord_url: args.discordUrl,
      website_url: args.websiteUrl,
      founder_name: args.founderName,
      founder_bio: args.founderBio,
      founder_pfp_url: args.founderPfpUrl,
      founder_twitter: args.founderTwitter,
      buy_button_enabled: args.buyButtonEnabled,
      buy_button_text: args.buyButtonText,
      buy_button_link: args.buyButtonLink,
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("product_pages", {
        project_id: args.projectId,
        ...data,
        is_live: false,
        is_featured: false,
        is_hidden: false,
        admin_approved: false,
      });
    }
  },
});

// Publish product page
export const publish = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("product_pages")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .first();
    
    if (!page) throw new Error("Product page not found");
    
    await ctx.db.patch(page._id, { is_live: true });
  },
});

// Unpublish product page
export const unpublish = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("product_pages")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .first();
    
    if (!page) throw new Error("Product page not found");
    
    await ctx.db.patch(page._id, { is_live: false });
  },
});
