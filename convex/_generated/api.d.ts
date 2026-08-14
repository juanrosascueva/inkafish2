/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as inventory from "../inventory.js";
import type * as master from "../master.js";
import type * as production from "../production.js";
import type * as products from "../products.js";
import type * as purchases from "../purchases.js";
import type * as requests from "../requests.js";
import type * as seed from "../seed.js";
import type * as suppliers from "../suppliers.js";
import type * as transfers from "../transfers.js";
import type * as waste from "../waste.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  inventory: typeof inventory;
  master: typeof master;
  production: typeof production;
  products: typeof products;
  purchases: typeof purchases;
  requests: typeof requests;
  seed: typeof seed;
  suppliers: typeof suppliers;
  transfers: typeof transfers;
  waste: typeof waste;
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
