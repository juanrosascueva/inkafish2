import { ConvexHttpClient } from "convex/browser";

export function cleanConvexUrl(url: string | undefined): string {
  if (!url) return "https://mock-dev-123.convex.cloud";
  return url.replace(/[\r\n"'\s]/g, "").trim();
}

const convexUrl = cleanConvexUrl(process.env.NEXT_PUBLIC_CONVEX_URL);

export const convexClient = new ConvexHttpClient(convexUrl);
