"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";

type Transfer = {
  id: number;
  transferNumber: string;
  status: string;
  plannedDate: string | null;
  dispatchedAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  createdAt: string;
  originSite: { id: number; name: string } | null;
  destinationSite: { id: number; name: string } | null;
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transfers")
      .then((r) => r.json())
      .then((d) => setTransfers(d.transfers ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Transferencias entre Sedes</h2>
          <p className="text-sm text-gray-500">{transfers.length} registros</p>
        </div>
        <Link href="/transfers/new">
          <Button><Plus className="h-4 w-4" />Nueva Transferencia</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : transfers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No hay transferencias registradas</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {transfers.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{t.transferNumber}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600 font-medium">{t.originSite?.name}</span>
                      <ArrowRight className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600 font-medium">{t.destinationSite?.name ?? "Destino"}</span>
                    </div>
                    {t.plannedDate && (
                      <p className="text-xs text-gray-400 mt-0.5">Planificada: {formatDate(t.plannedDate)}</p>
                    )}
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStatusColor(t.status))}>
                    {getStatusLabel(t.status)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
