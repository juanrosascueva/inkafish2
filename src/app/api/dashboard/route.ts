import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import {
  requests,
  inventoryBalances,
  products,
  lots,
  transfers,
  purchases,
  productionOrders,
  wasteRecords,
  notifications,
} from "@/db/schema";
import { eq, count, sql, lt, and, gt } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    pendingRequests,
    urgentRequests,
    inPreparation,
    observedReceipts,
    expiringLots,
    pendingTransfers,
    pendingPurchases,
    activeProduction,
    unreadNotifications,
  ] = await Promise.all([
    db.select({ count: count() }).from(requests).where(eq(requests.status, "PENDING_APPROVAL")),
    db.select({ count: count() }).from(requests).where(eq(requests.priority, "URGENT")),
    db.select({ count: count() }).from(requests).where(eq(requests.status, "IN_PREPARATION")),
    db.select({ count: count() }).from(requests).where(eq(requests.status, "OBSERVED")),
    db.select({ count: count() }).from(lots).where(
      and(
        lt(lots.expiresAt, sevenDaysFromNow),
        gt(lots.remainingQuantity, "0"),
        eq(lots.active, true)
      )
    ),
    db.select({ count: count() }).from(transfers).where(eq(transfers.status, "IN_TRANSIT")),
    db.select({ count: count() }).from(purchases).where(eq(purchases.status, "ORDERED")),
    db.select({ count: count() }).from(productionOrders).where(eq(productionOrders.status, "IN_PROGRESS")),
    db.select({ count: count() }).from(notifications).where(
      and(eq(notifications.userId, session.id), eq(notifications.read, false))
    ),
  ]);

  // Recent requests
  const recentRequests = await db
    .select({
      id: requests.id,
      requestNumber: requests.requestNumber,
      status: requests.status,
      priority: requests.priority,
      createdAt: requests.createdAt,
    })
    .from(requests)
    .orderBy(sql`${requests.createdAt} DESC`)
    .limit(5);

  // Monthly waste summary
  const wasteThisMonth = await db
    .select({ total: sql<number>`COALESCE(SUM(CAST(${wasteRecords.quantity} AS DECIMAL)), 0)` })
    .from(wasteRecords)
    .where(gt(wasteRecords.createdAt, thirtyDaysAgo));

  return NextResponse.json({
    stats: {
      pendingApprovals: pendingRequests[0]?.count ?? 0,
      urgentRequests: urgentRequests[0]?.count ?? 0,
      inPreparation: inPreparation[0]?.count ?? 0,
      observedOrders: observedReceipts[0]?.count ?? 0,
      expiringProducts: expiringLots[0]?.count ?? 0,
      transfersInTransit: pendingTransfers[0]?.count ?? 0,
      pendingPurchases: pendingPurchases[0]?.count ?? 0,
      activeProductions: activeProduction[0]?.count ?? 0,
      unreadNotifications: unreadNotifications[0]?.count ?? 0,
      wasteThisMonth: wasteThisMonth[0]?.total ?? 0,
    },
    recentRequests,
  });
}
