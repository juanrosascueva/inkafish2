import { ConvexHttpClient } from "convex/browser";

const rawUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://mock-dev-123.convex.cloud";
const convexUrl = rawUrl.trim();

export const convexClient = new ConvexHttpClient(convexUrl);
