import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx: any, args: any) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});

export const getSession = query({
  args: { token: v.string() },
  handler: async (ctx: any, args: any) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q: any) => q.eq("token", args.token))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;
    const user = await ctx.db.get(session.userId);
    if (!user || !user.active) return null;
    return { session, user };
  },
});

export const createSession = mutation({
  args: {
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx: any, args: any) => {
    return await ctx.db.insert("sessions", {
      userId: args.userId,
      token: args.token,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });
  },
});
