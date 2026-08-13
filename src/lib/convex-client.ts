import { ConvexHttpClient } from "convex/browser";

export function cleanConvexUrl(url: string | undefined): string {
  if (!url || url.includes("mock-dev")) {
    return "https://successful-stingray-319.convex.cloud";
  }
  const cleaned = url.replace(/[\r\n"'\s]/g, "").trim();
  return cleaned || "https://successful-stingray-319.convex.cloud";
}

export function getConvexClient() {
  const url = cleanConvexUrl(process.env.NEXT_PUBLIC_CONVEX_URL);
  return new ConvexHttpClient(url);
}

export const convexClient = getConvexClient();
