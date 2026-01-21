import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!convexUrl) {
  console.warn("[Convex] VITE_CONVEX_URL not set. Some features may not work.");
}

export const convex = new ConvexReactClient(
  convexUrl || "https://placeholder.convex.cloud"
);

// Clerk publishable key for auth
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
