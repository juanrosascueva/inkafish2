"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, getStatusColor, getStatusLabel, formatDate, formatCurrency } from "@/lib/utils";

type Purchase = {
  id: number;
  purchaseNumber: string;
  status: string;
  expectedDate: string | null;
  documentNumber: string | null;
  totalAmount: string | null;
  currency: string;
  notes: string | null;
  createdAt: string;
  supplier: { id: number; name: string } | null;
  site: { id: number; name: string } | null;
  requestedByUser: { id: number; name: string } | null;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/purchases")
      .then((r) => r.json())
      .then((d) => setPurchases(d.purchases ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalActive = purchases.filter((p) => !["RECEIVED", "CANCELLED"].includes(p.status)).length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Órdenes de Compra</h2>
          <p className="text-sm text-gray-500">{purchases.length} total · {totalActive} activas</p>
        </div>
        <Link href="/purchases/new">
          <Button><Plus className="h-4 w-4" />Nueva Compra</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : purchases.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No hay órdenes de compra</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{p.purchaseNumber}</p>
                    <p className="text-sm text-gray-600">{p.supplier?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.site?.name} · Por: {p.requestedByUser?.name}
                      {p.expectedDate && ` · Esperada: ${formatDate(p.expectedDate)}`}
                    </p>
                    {p.documentNumber && <p className="text-xs text-gray-400">Doc: {p.documentNumber}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStatusColor(p.status))}>
                      {getStatusLabel(p.status)}
                    </span>
                    {p.totalAmount && (
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(p.totalAmount, p.currency)}</p>
                    )}
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
