"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MasterData = {
  sites: { id: number; name: string }[];
  areas: { id: number; name: string; siteId: number }[];
  units: { id: number; name: string; symbol: string; allowsDecimals: boolean }[];
};

type Product = {
  id: number;
  name: string;
  code: string;
  unit: { id: number; name: string; symbol: string; allowsDecimals: boolean } | null;
};

type RequestItem = {
  tempId: string;
  productId?: number;
  productName?: string;
  isExtraordinary: boolean;
  productNameTemp?: string;
  requestedQuantity: number | string;
  unitId?: number;
  notes?: string;
};

export default function NewRequestPage() {
  const router = useRouter();
  const [master, setMaster] = useState<MasterData>({ sites: [], areas: [], units: [] });
  const [products, setProducts] = useState<Product[]>([]);
  const [siteId, setSiteId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [shift, setShift] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [type, setType] = useState("REGULAR");
  const [urgentReason, setUrgentReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<RequestItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filteredAreas = master.areas.filter((a) => !siteId || a.siteId === parseInt(siteId));

  useEffect(() => {
    fetch("/api/master")
      .then((r) => r.json())
      .then((d) => setMaster(d));
    fetch("/api/products?active=true")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: Math.random().toString(36).slice(2),
        isExtraordinary: false,
        requestedQuantity: "",
      },
    ]);
  };

  const removeItem = (tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId));
  };

  const updateItem = (tempId: string, updates: Partial<RequestItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, ...updates } : item))
    );
  };

  const handleProductSelect = (tempId: string, productId: string) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      updateItem(tempId, {
        productId: product.id,
        productName: product.name,
        unitId: product.unit?.id,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent, submitStatus: "DRAFT" | "PENDING_APPROVAL") => {
    e.preventDefault();
    setError("");

    if (!siteId || !areaId || !requiredDate) {
      setError("Complete los campos obligatorios");
      return;
    }

    if (items.length === 0) {
      setError("Agregue al menos un ítem");
      return;
    }

    if ((priority === "URGENT" || type === "URGENT") && !urgentReason) {
      setError("El motivo urgente es obligatorio");
      return;
    }

    const validItems = items.filter((i) => {
      const qty = parseFloat(String(i.requestedQuantity));
      return !isNaN(qty) && qty > 0 && (i.productId || i.productNameTemp);
    });

    if (validItems.length === 0) {
      setError("Verifique los ítems: productos y cantidades son requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId,
          areaId,
          requiredDate,
          shift,
          priority,
          type,
          urgentReason: urgentReason || undefined,
          notes: notes || undefined,
          items: validItems.map((i) => ({
            productId: i.productId,
            productNameTemp: i.productNameTemp,
            requestedQuantity: parseFloat(String(i.requestedQuantity)),
            unitId: i.unitId,
            notes: i.notes,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear solicitud");
        return;
      }

      const requestId = data.request.id;

      if (submitStatus === "PENDING_APPROVAL") {
        await fetch(`/api/requests/${requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit" }),
        });
      }

      router.push("/requests");
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  const isUrgent = priority === "URGENT" || type === "URGENT";

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Nueva Solicitud</h2>
        <p className="text-sm text-gray-500">Complete los datos para crear la solicitud</p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, "PENDING_APPROVAL")} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader><CardTitle className="text-base">Datos generales</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Sede *</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={siteId}
                  onChange={(e) => { setSiteId(e.target.value); setAreaId(""); }}
                  required
                >
                  <option value="">Seleccionar sede</option>
                  {master.sites.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Área *</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar área</option>
                  {filteredAreas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fecha requerida *</Label>
                <Input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Turno</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                >
                  <option value="">Sin turno</option>
                  <option value="MAÑANA">Mañana</option>
                  <option value="TARDE">Tarde</option>
                  <option value="NOCHE">Noche</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="URGENT">🚨 Urgente</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="REGULAR">Regular</option>
                  <option value="EXTRAORDINARY">Extraordinaria</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </div>

            {isUrgent && (
              <div className="space-y-1.5">
                <Label className="text-red-600">Motivo urgente *</Label>
                <Input
                  value={urgentReason}
                  onChange={(e) => setUrgentReason(e.target.value)}
                  placeholder="Describa el motivo de la urgencia..."
                  required={isUrgent}
                  className="border-red-300 focus-visible:ring-red-500"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Ítems solicitados ({items.length})</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" />
                Agregar ítem
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No hay ítems. Haga clic en &quot;Agregar ítem&quot;</p>
              </div>
            )}
            {items.map((item, idx) => (
              <div key={item.tempId} className="p-4 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Ítem {idx + 1}</p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={item.isExtraordinary}
                        onChange={(e) => updateItem(item.tempId, { isExtraordinary: e.target.checked, productId: undefined })}
                        className="rounded"
                      />
                      Extraordinario
                    </label>
                    <button
                      type="button"
                      onClick={() => removeItem(item.tempId)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {item.isExtraordinary ? (
                  <div className="space-y-1.5">
                    <Label>Nombre del producto *</Label>
                    <Input
                      placeholder="Nombre del producto extraordinario"
                      value={item.productNameTemp ?? ""}
                      onChange={(e) => updateItem(item.tempId, { productNameTemp: e.target.value })}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Producto *</Label>
                    <select
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.productId ?? ""}
                      onChange={(e) => handleProductSelect(item.tempId, e.target.value)}
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cantidad *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={item.requestedQuantity}
                      onChange={(e) => updateItem(item.tempId, { requestedQuantity: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unidad *</Label>
                    <select
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.unitId ?? ""}
                      onChange={(e) => updateItem(item.tempId, { unitId: parseInt(e.target.value) })}
                    >
                      <option value="">Seleccionar</option>
                      {master.units.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Notas del ítem</Label>
                  <Input
                    placeholder="Especificaciones adicionales..."
                    value={item.notes ?? ""}
                    onChange={(e) => updateItem(item.tempId, { notes: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e as React.FormEvent, "DRAFT")}
            disabled={submitting}
            className="flex-1 sm:flex-none"
          >
            Guardar borrador
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? "Enviando..." : "Enviar para aprobación"}
          </Button>
        </div>
      </form>
    </div>
  );
}
