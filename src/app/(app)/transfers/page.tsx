"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowRight, Truck, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { cn, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";

type TransferItem = {
  _id: string;
  product: { _id: string; name: string; code: string } | null;
  unit: { _id: string; symbol: string } | null;
  requestedQuantity: number;
  shippedQuantity: number;
  receivedQuantity?: number;
  lossQuantity?: number;
};

type Transfer = {
  id: string;
  transferNumber: string;
  status: string;
  plannedDate: string | null;
  dispatchedAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  discrepancyNote?: string;
  createdAt: string;
  originSite: { id: string; name: string } | null;
  destinationSite: { id: string; name: string } | null;
  requestedBy: { id: string; name: string } | null;
  items: TransferItem[];
};

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Reception Modal State
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, string>>({});
  const [discrepancyNote, setDiscrepancyNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTransfers = () => {
    fetch("/api/transfers")
      .then((r) => r.json())
      .then((d) => setTransfers(d.transfers ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleShip = async (transferId: string) => {
    if (!confirm("¿Deseas despachar esta transferencia? El stock se descontará por FEFO de la sede origen y pasará a EN TRÁNSITO.")) return;
    try {
      const res = await fetch("/api/transfers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ship", transferId }),
      });
      if (res.ok) {
        fetchTransfers();
      }
    } catch {
      alert("Error al despachar transferencia");
    }
  };

  const handleOpenReceive = (t: Transfer) => {
    setSelectedTransfer(t);
    const initialQty: Record<string, string> = {};
    t.items.forEach((item) => {
      initialQty[item._id] = String(item.shippedQuantity || item.requestedQuantity);
    });
    setReceivedQuantities(initialQty);
    setDiscrepancyNote("");
    setReceiveModalOpen(true);
  };

  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransfer) return;

    setSubmitting(true);
    try {
      const payload = {
        action: "receive",
        transferId: selectedTransfer.id,
        discrepancyNote: discrepancyNote || undefined,
        receivedItems: selectedTransfer.items.map((i) => ({
          itemId: i._id,
          receivedQuantity: parseFloat(receivedQuantities[i._id]) || 0,
        })),
      };

      const res = await fetch("/api/transfers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setReceiveModalOpen(false);
        fetchTransfers();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Transferencias entre Sedes</h2>
          <p className="text-sm text-gray-500">{transfers.length} registros · Flujo 3 Estados (San Miguel ↔ Lince)</p>
        </div>
        <Link href="/transfers/new">
          <Button><Plus className="h-4 w-4" />Nueva Transferencia</Button>
        </Link>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : transfers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No hay transferencias registradas</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {transfers.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm">{t.transferNumber}</p>
                      <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-semibold", getStatusColor(t.status))}>
                        {getStatusLabel(t.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs font-bold text-[#1b6970] bg-teal-50 px-2 py-0.5 rounded">{t.originSite?.name || "San Miguel"}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs font-bold text-[#1b6970] bg-teal-50 px-2 py-0.5 rounded">{t.destinationSite?.name || "Lince"}</span>
                    </div>
                    {t.requestedBy && (
                      <p className="text-xs text-gray-500 mt-1">Solicitado por: <span className="font-semibold text-gray-700">{t.requestedBy.name}</span></p>
                    )}
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 items-end">
                    {t.status === "REQUESTED" && (
                      <Button size="sm" onClick={() => handleShip(t.id)} className="h-8 text-xs bg-[#1b6970] hover:bg-[#15545a]">
                        <Truck className="h-3.5 w-3.5 mr-1" />Despachar (En Tránsito)
                      </Button>
                    )}
                    {t.status === "IN_TRANSIT" && (
                      <Button size="sm" onClick={() => handleOpenReceive(t)} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Recepcionar en Destino
                      </Button>
                    )}
                  </div>
                </div>

                {/* Transfer Items Summary */}
                {t.items && t.items.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Productos a Transferir:</p>
                    <div className="flex flex-wrap gap-2">
                      {t.items.map((i, idx) => (
                        <div key={idx} className="text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded-md flex items-center gap-1.5">
                          <span className="font-medium text-gray-800">{i.product?.name || "Producto"}</span>
                          <span className="font-bold text-[#1b6970]">{i.shippedQuantity || i.requestedQuantity} {i.unit?.symbol || "UND"}</span>
                          {i.lossQuantity && i.lossQuantity > 0 ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded">⚠️ Pérdida: {i.lossQuantity}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {t.discrepancyNote && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                    <span><strong>Nota de Discrepancia:</strong> {t.discrepancyNote}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Recepción Física con Control de Mermas en Tránsito */}
      <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Conformidad de Recepción Física</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <form onSubmit={handleConfirmReceive} className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900">
                <p className="font-bold text-[#1b6970]">📦 Recepción en {selectedTransfer.destinationSite?.name || "Sede Destino"}</p>
                <p className="mt-0.5">Ingresa la cantidad física realmente recibida. Si difiere de lo enviado, el faltante se registrará automáticamente como <strong>Merma en Tránsito</strong>.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-700">Comprobar Cantidades Recibidas *</Label>
                {selectedTransfer.items.map((item) => {
                  const shipped = item.shippedQuantity || item.requestedQuantity;
                  const currentVal = parseFloat(receivedQuantities[item._id] || "0");
                  const diff = Math.max(0, shipped - (isNaN(currentVal) ? 0 : currentVal));

                  return (
                    <div key={item._id} className="p-3 border border-gray-200 rounded-xl space-y-2 bg-gray-50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-900">{item.product?.name}</span>
                        <span className="text-gray-500">Enviado: <strong className="text-gray-900">{shipped} {item.unit?.symbol}</strong></span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <div>
                          <Label className="text-[11px] text-gray-500">Cantidad Recibida *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={receivedQuantities[item._id] || ""}
                            onChange={(e) => setReceivedQuantities({ ...receivedQuantities, [item._id]: e.target.value })}
                            required
                            className="h-9 text-xs"
                          />
                        </div>
                        <div className="text-right">
                          <Label className="text-[11px] text-gray-500">Faltante (Merma)</Label>
                          <p className={cn("text-xs font-bold mt-1", diff > 0 ? "text-red-600" : "text-emerald-600")}>
                            {diff > 0 ? `⚠️ -${diff} ${item.unit?.symbol}` : "✓ Sin Faltantes"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <Label>Observación / Justificación de Faltante</Label>
                <Textarea
                  value={discrepancyNote}
                  onChange={(e) => setDiscrepancyNote(e.target.value)}
                  placeholder="Ej: Empaque dañado durante el transporte..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setReceiveModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? "Confirmando..." : "Confirmar Recepción"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
