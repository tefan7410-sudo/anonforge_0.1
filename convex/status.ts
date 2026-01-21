import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all service statuses
export const getServices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("service_status")
      .collect();
  },
});

// Get active incidents
export const getActiveIncidents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("status_incidents")
      .withIndex("by_active", (q) => q.eq("is_active", true))
      .collect();
  },
});

// Get incident history
export const getIncidentHistory = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - args.days);
    
    return await ctx.db
      .query("status_incidents")
      .filter((q) => 
        q.and(
          q.eq(q.field("is_active"), false),
          q.gte(q.field("_creationTime"), cutoffDate.getTime())
        )
      )
      .order("desc")
      .collect();
  },
});

// Get maintenance mode setting
export const getMaintenanceMode = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("site_settings")
      .withIndex("by_key", (q) => q.eq("key", "maintenance_mode"))
      .first();
    
    if (!setting) {
      return { enabled: false, message: null, incident_id: null };
    }
    
    const value = setting.value as Record<string, unknown>;
    return {
      enabled: Boolean(value?.enabled),
      message: typeof value?.message === 'string' ? value.message : null,
      incident_id: typeof value?.incident_id === 'string' ? value.incident_id : null,
    };
  },
});

// Update service status (admin)
export const updateService = mutation({
  args: {
    id: v.id("service_status"),
    status: v.string(),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      error_message: args.error_message,
      last_check_at: new Date().toISOString(),
    });
  },
});
