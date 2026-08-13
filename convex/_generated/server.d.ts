import {
  GenericQueryCtx,
  GenericMutationCtx,
  GenericActionCtx,
} from "convex/server";
import { DataModel } from "./dataModel";

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;

export declare function query(definition: any): any;
export declare function mutation(definition: any): any;
export declare function action(definition: any): any;
export declare function internalQuery(definition: any): any;
export declare function internalMutation(definition: any): any;
export declare function internalAction(definition: any): any;
