import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    stats: {
      pendingApprovals: 0,
      urgentRequests: 0,
      inPreparation: 0,
      observedOrders: 0,
      expiringProducts: 0,
      transfersInTransit: 0,
      pendingPurchases: 0,
      activeProductions: 0,
      unreadNotifications: 0,
      wasteThisMonth: 0,
    },
    recentRequests: [],
  });
}
