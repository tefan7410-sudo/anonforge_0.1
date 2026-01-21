/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as credits from "../credits.js";
import type * as files from "../files.js";
import type * as generations from "../generations.js";
import type * as layers from "../layers.js";
import type * as marketing from "../marketing.js";
import type * as notifications from "../notifications.js";
import type * as productPages from "../productPages.js";
import type * as profiles from "../profiles.js";
import type * as projects from "../projects.js";
import type * as status from "../status.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  categories: typeof categories;
  credits: typeof credits;
  files: typeof files;
  generations: typeof generations;
  layers: typeof layers;
  marketing: typeof marketing;
  notifications: typeof notifications;
  productPages: typeof productPages;
  profiles: typeof profiles;
  projects: typeof projects;
  status: typeof status;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
