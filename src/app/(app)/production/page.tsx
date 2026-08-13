"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";

type ProductionOrder = {
  id: number;
  productionOrderNumber: string;
  status: string;
  plannedDate: string;
  shift: string | null;
  totalInputQuantity: string | null;
  totalOutputQuantity: string | null;
  wasteQuantity: string | null;
  yieldPercentage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  site: { id: number; name: string } | null;
  area: { id: number; name: string } | null;
  createdByUser: { id: number; name: string } | null;
};

export default function ProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/production")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, []);

  const active = orders.filter((o) => o.status === "IN_PROGRESS").length;
  const planned = orders.filter((o) => o.status === "PLANNED").length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Producción</h2>
          <p className="text-sm text-gray-500">{active} activas · {planned} planificadas</p>
        </div>
        <Link href="/production/new">
          <Button><Plus className="h-4 w-4" />Nueva Orden</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{planned}</p>
          <p className="text-xs text-blue-600">Planificadas</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">{active}</p>
          <p className="text-xs text-purple-600">En progreso</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{orders.filter((o) => o.status === "COMPLETED").length}</p>
          <p className="text-xs text-green-600">Completadas</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No hay órdenes de producción</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Link key={o.id} href={`/production/${o.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{o.productionOrderNumber}</p>
                      <p className="text-sm text-gray-600">{o.site?.name} · {o.area?.name ?? "Producción"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Planificada: {formatDate(o.plannedDate)}
                        {o.shift && ` · Turno: ${o.shift}`}
                      </p>
                      {o.status === "COMPLETED" && o.yieldPercentage && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          Rendimiento: {parseFloat(o.yieldPercentage).toFixed(1)}%
                          {o.wasteQuantity && ` · Merma: ${parseFloat(o.wasteQuantity).toFixed(2)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStatusColor(o.status))}>
                        {getStatusLabel(o.status)}
                      </span>
                      {o.status === "PLANNED" && (
                        <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                          <Play className="h-3 w-3" />Iniciar
                        </span>
                      )}
                      {o.status === "IN_PROGRESS" && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />Completar
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
