"use client";
import React, { useEffect, useState } from "react";
import {
  ClipboardList,
  AlertTriangle,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  Factory,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, getStatusColor, getStatusLabel, formatDateTime } from "@/lib/utils";
import Link from "next/link";

type SessionUser = {
  id: string | number;
  name: string;
  role: string;
  email: string;
  siteId: string | number | null;
  areaId: string | number | null;
};

type DashboardStats = {
  pendingApprovals: number;
  urgentRequests: number;
  inPreparation: number;
  observedOrders: number;
  expiringProducts: number;
  transfersInTransit: number;
  pendingPurchases: number;
  activeProductions: number;
  unreadNotifications: number;
  wasteThisMonth: number;
};

type RecentRequest = {
  id: string | number;
  requestNumber: string;
  status: string;
  priority: string;
  createdAt: string;
};


const statCards = [
  { key: "pendingApprovals", label: "Pendientes de aprobación", icon: ClipboardList, color: "text-yellow-600 bg-yellow-50", href: "/approvals" },
  { key: "urgentRequests", label: "Solicitudes urgentes", icon: AlertTriangle, color: "text-red-600 bg-red-50", href: "/requests?priority=URGENT" },
  { key: "inPreparation", label: "En preparación", icon: Package, color: "text-purple-600 bg-purple-50", href: "/warehouse" },
  { key: "observedOrders", label: "Pedidos observados", icon: Eye, color: "text-amber-600 bg-amber-50", href: "/requests?status=OBSERVED" },
  { key: "expiringProducts", label: "Próximos a vencer", icon: Clock, color: "text-orange-600 bg-orange-50", href: "/inventory?type=lots" },
  { key: "transfersInTransit", label: "Transferencias en tránsito", icon: ArrowLeftRight, color: "text-blue-600 bg-blue-50", href: "/transfers" },
  { key: "pendingPurchases", label: "Compras pendientes", icon: ShoppingCart, color: "text-indigo-600 bg-indigo-50", href: "/purchases" },
  { key: "activeProductions", label: "Producciones activas", icon: Factory, color: "text-green-600 bg-green-50", href: "/production" },
];

export function DashboardClient({ user }: { user: SessionUser }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setRecentRequests(d.recentRequests ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user.name.split(" ")[0]}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Panel de control · {new Date().toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const value = stats ? stats[card.key as keyof DashboardStats] : 0;
          return (
            <Link key={card.key} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                      <p className="text-2xl font-bold mt-1 text-gray-900">
                        {loading ? "..." : String(value)}
                      </p>
                    </div>
                    <div className={cn("p-2 rounded-lg", card.color)}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent Requests + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Solicitudes recientes</CardTitle>
              <Link href="/requests" className="text-sm text-[#347B85] font-semibold hover:underline">
                Ver todas
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recentRequests.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                No hay solicitudes recientes
              </p>
            ) : (
              <div className="space-y-2">
                {recentRequests.map((req) => (
                  <Link
                    key={req.id}
                    href={`/requests/${req.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-teal-50/40 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{req.requestNumber}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(req.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {req.priority === "URGENT" && (
                        <span className="text-xs bg-[#E6007E]/10 text-[#E6007E] border border-[#E6007E]/20 px-1.5 py-0.5 rounded font-semibold">
                          Urgente
                        </span>
                      )}
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStatusColor(req.status))}>
                        {getStatusLabel(req.status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { href: "/requests/new", label: "Nueva Solicitud", icon: ClipboardList, color: "bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/60" },
                { href: "/approvals", label: "Ver Aprobaciones", icon: CheckCircle, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60" },
                { href: "/inventory", label: "Ver Inventario", icon: Package, color: "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60" },
                { href: "/transfers/new", label: "Nueva Transferencia", icon: ArrowLeftRight, color: "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200/60" },
                { href: "/purchases/new", label: "Nueva Compra", icon: ShoppingCart, color: "bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200/60" },
                { href: "/production/new", label: "Nueva Producción", icon: Factory, color: "bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/60" },
                { href: "/waste/new", label: "Registrar Merma", icon: Trash2, color: "bg-red-50 text-red-700 hover:bg-red-100" },
                { href: "/reports", label: "Ver Reportes", icon: TrendingUp, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-colors",
                    action.color
                  )}
                >
                  <action.icon className="h-6 w-6" />
                  <span className="text-xs font-medium leading-tight">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waste this month */}
      {stats && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Merma del período</p>
                <p className="text-xs text-gray-500">Últimos 30 días</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xl font-bold text-red-600">
                  {parseFloat(String(stats.wasteThisMonth)).toFixed(2)} unid.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
