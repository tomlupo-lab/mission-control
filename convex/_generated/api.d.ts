/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as agents from "../agents.js";
import type * as cron from "../cron.js";
import type * as health from "../health.js";
import type * as meals from "../meals.js";
import type * as reports from "../reports.js";
import type * as tes from "../tes.js";
import type * as trading from "../trading.js";
import type * as weekly from "../weekly.js";
import type * as ziolo from "../ziolo.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  agents: typeof agents;
  cron: typeof cron;
  health: typeof health;
  meals: typeof meals;
  reports: typeof reports;
  tes: typeof tes;
  trading: typeof trading;
  weekly: typeof weekly;
  ziolo: typeof ziolo;
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
