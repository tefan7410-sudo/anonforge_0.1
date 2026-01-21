import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getViewer } from "./auth";

// Submit a new bug report
export const submit = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    screenshotUrl: v.optional(v.string()),
    pageUrl: v.optional(v.string()),
    browserInfo: v.optional(v.any()),
    consoleLogs: v.optional(v.any()),
    userActions: v.optional(v.any()),
    errorStack: v.optional(v.string()),
    severity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewer(ctx);
    const userId = viewer?.userId;
    
    return await ctx.db.insert("bug_reports", {
      user_id: userId,
      title: args.title,
      description: args.description,
      screenshot_url: args.screenshotUrl,
      status: "open",
      severity: args.severity || "medium",
      session_log: {
        browser_info: args.browserInfo,
        console_logs: args.consoleLogs,
        user_actions: args.userActions,
        error_stack: args.errorStack,
        page_url: args.pageUrl,
      },
      updated_at: new Date().toISOString(),
    });
  },
});

// Get current user's bug reports
export const getMyReports = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getViewer(ctx);
    if (!viewer) return [];
    
    return await ctx.db
      .query("bug_reports")
      .filter((q) => q.eq(q.field("user_id"), viewer.userId))
      .order("desc")
      .collect();
  },
});
