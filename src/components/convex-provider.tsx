"use client";

import { ReactNode, useState } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { cleanConvexUrl } from "@/lib/convex-client";

const convexUrl = cleanConvexUrl(process.env.NEXT_PUBLIC_CONVEX_URL);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex] = useState(() => new ConvexReactClient(convexUrl));
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
