import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for file storage
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Store file metadata after upload
export const saveFileMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    purpose: v.string(),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.email || "anonymous";
    
    // Get the URL for the stored file
    const url = await ctx.storage.getUrl(args.storageId);
    
    return {
      storageId: args.storageId,
      url,
      filename: args.filename,
      uploadedBy: userId,
    };
  },
});

// Get file URL by storage ID
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Delete file
export const deleteFile = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await ctx.storage.delete(args.storageId);
    return true;
  },
});

// Upload avatar
export const uploadAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || !identity.email) {
      throw new Error("Not authenticated");
    }
    
    const url = await ctx.storage.getUrl(args.storageId);
    
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();
    
    if (profile) {
      await ctx.db.patch(profile._id, { avatar_url: url });
    }
    
    return url;
  },
});

// Upload layer image
export const uploadLayer = mutation({
  args: {
    storageId: v.id("_storage"),
    categoryId: v.id("categories"),
    filename: v.string(),
    traitName: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    
    // Get highest order index in category
    const layers = await ctx.db
      .query("layers")
      .withIndex("by_category", (q) => q.eq("category_id", args.categoryId))
      .collect();
    
    const maxOrder = Math.max(...layers.map((l) => l.order_index), -1);
    
    const layerId = await ctx.db.insert("layers", {
      category_id: args.categoryId,
      filename: args.filename,
      trait_name: args.traitName,
      display_name: args.displayName,
      storage_path: url || "",
      order_index: maxOrder + 1,
      rarity_weight: 100,
      is_effect_layer: false,
    });
    
    return { layerId, url };
  },
});

// Upload product page assets
export const uploadProductAsset = mutation({
  args: {
    storageId: v.id("_storage"),
    projectId: v.id("projects"),
    assetType: v.union(v.literal("logo"), v.literal("banner"), v.literal("founder_pfp"), v.literal("hero")),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    
    const productPage = await ctx.db
      .query("product_pages")
      .withIndex("by_project", (q) => q.eq("project_id", args.projectId))
      .first();
    
    if (!productPage) {
      // Create product page if it doesn't exist
      await ctx.db.insert("product_pages", {
        project_id: args.projectId,
        [args.assetType === "logo" ? "logo_url" : 
         args.assetType === "banner" ? "banner_url" : 
         args.assetType === "founder_pfp" ? "founder_pfp_url" : "logo_url"]: url,
        is_live: false,
        is_featured: false,
        is_hidden: false,
        admin_approved: false,
      });
    } else {
      const updateField = args.assetType === "logo" ? "logo_url" : 
                          args.assetType === "banner" ? "banner_url" : 
                          args.assetType === "founder_pfp" ? "founder_pfp_url" : "logo_url";
      await ctx.db.patch(productPage._id, { [updateField]: url });
    }
    
    return url;
  },
});

// Upload hero background (admin)
export const uploadHeroBackground = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    
    const existing = await ctx.db.query("hero_backgrounds").collect();
    const maxOrder = Math.max(...existing.map((h) => h.display_order || 0), -1);
    
    const id = await ctx.db.insert("hero_backgrounds", {
      image_url: url || "",
      storage_path: args.storageId,
      is_active: true,
      display_order: maxOrder + 1,
    });
    
    return { id, url };
  },
});
