"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, PackageCheck, Ban, Clock, Building2, Warehouse, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn, getStatusColor, getStatusLabel, formatDate, formatCurrency } from "@/lib/utils";

type PurchaseDetail = {
  id: string;
  purchaseNumber: string;
  status: string;
  expectedDate: string | null;
  documentNumber: string | null;
  totalAmount: number | null;
  currency: string;
  notes: string | null;
  createdAt: number | string;
  supplier: { id: string; name: string; documentNumber?: string } | null;
  site: { id: string; name: string } | null;
  warehouse: { id: string; name: string } | null;
  requestedByUser: { id: string; name: string } | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    receivedQuantity: number;
    notes: string | null;
    product: { id: string; code: string; name: string } | null;
    unit: { id: string; name: string; symbol: string } | null;
  }[];
};

export default function PurchaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Receive Dialog
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [documentNumber, setDocumentNumber] = useState("");

  const fetchDetail = () => {
    fetch(`/api/purchases/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.purchase) setPurchase(d.purchase);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/purchases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });
      if (res.ok) fetchDetail();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("¿Estás seguro de anular esta orden de compra?")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/purchases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      if (res.ok) fetchDetail();
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/purchases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RECEIVE", documentNumber }),
      });
      if (res.ok) {
        setReceiveDialogOpen(false);
        fetchDetail();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="h-20 bg-white rounded-xl border animate-pulse" />
        <div className="h-64 bg-white rounded-xl border animate-pulse" />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="p-4 lg:p-6 text-center">
        <p className="text-gray-500">Orden de compra no encontrada</p>
        <Link href="/purchases">
          <Button variant="outline" className="mt-3">Volver a Órdenes de Compra</Button>
        </Link>
      </div>
    );
  }

  const isPending = purchase.status === "PENDING" || purchase.status === "DRAFT";
  const isApproved = purchase.status === "APPROVED";
  const isReceived = purchase.status === "RECEIVED";
  const isCancelled = purchase.status === "CANCELLED";

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-5xl mx-auto">
      {/* Navigation & Actions Header */}
      <div className="flex items-center justify-between gap-3">
        <Link href="/purchases" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a Órdenes de Compra
        </Link>

        <div className="flex items-center gap-2">
          {isPending && (
            <Button onClick={handleApprove} disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Aprobar Compra
            </Button>
          )}

          {(isPending || isApproved) && (
            <Button onClick={() => setReceiveDialogOpen(true)} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              <PackageCheck className="h-4 w-4 mr-1.5" /> Recibir y Cargar a Inventario
            </Button>
          )}

          {!isCancelled && !isReceived && (
            <Button variant="outline" onClick={handleCancel} disabled={submitting} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              <Ban className="h-4 w-4 mr-1.5" /> Anular
            </Button>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{purchase.purchaseNumber}</h1>
                <span className={cn("text-xs px-2.5 py-1 rounded-full font-semibold", getStatusColor(purchase.status))}>
                  {getStatusLabel(purchase.status)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Emitida el: {formatDate(new Date(purchase.createdAt))}</p>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">Monto Total</p>
              <p className="text-2xl font-black text-gray-900">
                {formatCurrency(purchase.totalAmount || 0, purchase.currency || "PEN")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
              <Building2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500">Proveedor</p>
                <p className="text-sm font-semibold text-gray-900">{purchase.supplier?.name || "Sin especificar"}</p>
                {purchase.supplier?.documentNumber && <p className="text-xs text-gray-400">RUC: {purchase.supplier.documentNumber}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
              <Warehouse className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500">Almacén Destino</p>
                <p className="text-sm font-semibold text-gray-900">{purchase.warehouse?.name || "Almacén Principal"}</p>
                <p className="text-xs text-gray-400">Sede: {purchase.site?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border">
              <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-500">Fecha Esperada</p>
                <p className="text-sm font-semibold text-gray-900">
                  {purchase.expectedDate ? formatDate(purchase.expectedDate) : "Por definir"}
                </p>
                {purchase.documentNumber && <p className="text-xs text-blue-600 font-medium">Factura/Guía: {purchase.documentNumber}</p>}
              </div>
            </div>
          </div>

          {purchase.notes && (
            <div className="bg-yellow-50/60 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-900">
              📌 <strong>Notas de la compra:</strong> {purchase.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Table Card */}
      <Card>
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
            <span>Insumos / Productos Solicitados</span>
            <span className="text-xs font-normal text-gray-500">{purchase.items.length} ítems en la orden</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Producto / Insumo</th>
                  <th className="py-3 px-4 text-center">Cantidad Solicitada</th>
                  <th className="py-3 px-4 text-center">Cantidad Recibida</th>
                  <th className="py-3 px-4 text-right">Precio Unitario</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchase.items.map((item) => {
                  const subtotal = item.quantity * (item.unitPrice || 0);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-mono text-xs text-gray-500">{item.product?.code || "P-000"}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{item.product?.name || "Producto desconocido"}</td>
                      <td className="py-3 px-4 text-center font-semibold text-gray-900">
                        {item.quantity} {item.unit?.symbol || "UND"}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold">
                        <span className={item.receivedQuantity > 0 ? "text-green-600" : "text-gray-400"}>
                          {item.receivedQuantity} {item.unit?.symbol || "UND"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">{formatCurrency(item.unitPrice || 0, purchase.currency || "PEN")}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {formatCurrency(subtotal, purchase.currency || "PEN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Receiving Purchase */}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <PackageCheck className="h-5 w-5" /> Recepcionar Orden de Compra
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmReceive} className="space-y-4">
            <p className="text-sm text-gray-600">
              Al recepcionar esta orden de compra, el sistema <strong>incrementará automáticamente los saldos de inventario</strong> en el almacén <strong>{purchase.warehouse?.name || "Almacén Principal"}</strong> y creará los lotes con vencimiento para trazabilidad FEFO.
            </p>

            <div className="space-y-1.5">
              <Label>Número de Comprobante / Factura / Guía de Remisión (Opcional)</Label>
              <Input
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Ej: F001-0004928"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReceiveDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
                {submitting ? "Cargando stock..." : "Confirmar Recepción e Ingresar Stock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
