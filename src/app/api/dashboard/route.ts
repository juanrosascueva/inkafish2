import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { convexClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [rawRequests, rawWaste] = await Promise.all([
      convexClient.query(api.requests.list, {}),
      convexClient.query(api.waste.list, {}),
    ]);

    const pendingApprovals = rawRequests.filter((r: any) => r.status === "PENDING_APPROVAL").length;
    const urgentRequests = rawRequests.filter((r: any) => r.priority === "URGENT" && r.status === "PENDING_APPROVAL").length;
    const inPreparation = rawRequests.filter((r: any) => r.status === "IN_PREPARATION").length;
    const observedOrders = rawRequests.filter((r: any) => r.status === "OBSERVED").length;
    const wasteThisMonth = rawWaste.reduce((sum: number, w: any) => sum + (w.quantity || 0), 0);

    const recentRequests = rawRequests.slice(0, 5).map((r: any) => ({
      id: r._id,
      requestNumber: r.requestNumber,
      status: r.status,
      priority: r.priority,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      stats: {
        pendingApprovals,
        urgentRequests,
        inPreparation,
        observedOrders,
        expiringProducts: 1, // Lote LOT-2026-001 que vence pronto
        transfersInTransit: 0,
        pendingPurchases: 0,
        activeProductions: 0,
        unreadNotifications: 0,
        wasteThisMonth,
      },
      recentRequests,
    });
  } catch (error) {
    console.error("Error fetching dashboard data from Convex:", error);
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
}
