"use client";

import { ReactNode, useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const rawUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://mock-dev-123.convex.cloud";
const convexUrl = rawUrl.replace(/^["'\s]+|["'\s]+$/g, "");

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex] = useState(() => new ConvexReactClient(convexUrl));
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
