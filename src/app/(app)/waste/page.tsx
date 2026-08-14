"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { cn, formatDateTime } from "@/lib/utils";

type WasteRecord = {
  id: number;
  quantity: string;
  stage: string;
  cause: string;
  consumesStock: boolean;
  occurredAt: string;
  notes: string | null;
  createdAt: string;
  product: { id: number; name: string; code: string } | null;
  unit: { id: number; name: string; symbol: string } | null;
  area: { id: number; name: string } | null;
  site: { id: number; name: string } | null;
  responsibleUser: { id: number; name: string } | null;
};

const stageLabels: Record<string, string> = {
  STORAGE: "🏪 Almacenamiento",
  PRODUCTION: "🏭 Producción",
  PREPARATION: "👨‍🍳 Preparación",
  SERVICE: "🍽️ Servicio",
  RETURN: "↩️ Devolución",
  OTHER: "📌 Otro",
};

export default function WastePage() {
  const [waste, setWaste] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/waste")
      .then((r) => r.json())
      .then((d) => setWaste(d.waste ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalWaste = waste.reduce((sum, w) => sum + parseFloat(w.quantity), 0);
  const stockConsuming = waste.filter((w) => w.consumesStock).length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Mermas y Desperdicios</h2>
          <p className="text-sm text-gray-500">{waste.length} registros · Total: {totalWaste.toFixed(2)} unid.</p>
        </div>
        <Link href="/waste/new">
          <Button><Plus className="h-4 w-4" />Registrar Merma</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{waste.length}</p>
          <p className="text-xs text-red-600">Total registros</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{stockConsuming}</p>
          <p className="text-xs text-amber-600">Consume stock</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-purple-700">{waste.filter((w) => !w.consumesStock).length}</p>
          <p className="text-xs text-purple-600">Analíticas</p>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : waste.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No hay mermas registradas</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {waste.map((w) => (
            <Card key={w.id} className={cn(!w.consumesStock && "border-purple-200 bg-purple-50/20")}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{w.product?.name}</p>
                      {!w.consumesStock && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                          Analítica
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stageLabels[w.stage] ?? w.stage} · {w.area?.name ?? w.site?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Causa: {w.cause} · Por: {w.responsibleUser?.name}
                    </p>
                    <p className="text-xs text-gray-400">{formatDateTime(w.occurredAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{parseFloat(w.quantity).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{w.unit?.symbol}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
