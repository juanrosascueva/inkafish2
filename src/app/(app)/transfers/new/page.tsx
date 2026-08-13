"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Site = { id: number; name: string };
type Warehouse = { id: number; name: string; siteId: number };
type Product = { id: number; name: string; code: string; unit: { id: number; name: string; symbol: string } | null };
type Unit = { id: number; name: string; symbol: string };

export default function NewTransferPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [originSiteId, setOriginSiteId] = useState("");
  const [destinationSiteId, setDestinationSiteId] = useState("");
  const [originWarehouseId, setOriginWarehouseId] = useState("");
  const [destinationWarehouseId, setDestinationWarehouseId] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ tempId: string; productId: string; unitId: string; requestedQuantity: string; notes: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/master").then((r) => r.json()).then((d) => {
      setSites(d.sites ?? []);
      setWarehouses(d.warehouses ?? []);
      setUnits(d.units ?? []);
    });
    fetch("/api/products?active=true").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
  }, []);

  const originWarehouses = warehouses.filter((w) => w.siteId === parseInt(originSiteId));
  const destWarehouses = warehouses.filter((w) => w.siteId === parseInt(destinationSiteId));

  const addItem = () => setItems((prev) => [...prev, { tempId: Math.random().toString(36).slice(2), productId: "", unitId: "", requestedQuantity: "", notes: "" }]);
  const removeItem = (tid: string) => setItems((prev) => prev.filter((i) => i.tempId !== tid));
  const updateItem = (tid: string, updates: Partial<typeof items[0]>) => setItems((prev) => prev.map((i) => i.tempId === tid ? { ...i, ...updates } : i));

  const handleProductSelect = (tid: string, pId: string) => {
    const p = products.find((p) => p.id === parseInt(pId));
    updateItem(tid, { productId: pId, unitId: p?.unit?.id ? String(p.unit.id) : "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!originSiteId || !destinationSiteId) {
      setError("Seleccione origen y destino");
      return;
    }

    if (originSiteId === destinationSiteId) {
      setError("Origen y destino deben ser diferentes");
      return;
    }

    const validItems = items.filter((i) => i.productId && i.unitId && parseFloat(i.requestedQuantity) > 0);
    if (validItems.length === 0) {
      setError("Agregue al menos un ítem válido");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originSiteId: parseInt(originSiteId),
          destinationSiteId: parseInt(destinationSiteId),
          originWarehouseId: originWarehouseId ? parseInt(originWarehouseId) : undefined,
          destinationWarehouseId: destinationWarehouseId ? parseInt(destinationWarehouseId) : undefined,
          plannedDate: plannedDate || undefined,
          notes: notes || undefined,
          items: validItems.map((i) => ({
            productId: parseInt(i.productId),
            unitId: parseInt(i.unitId),
            requestedQuantity: parseFloat(i.requestedQuantity),
            notes: i.notes || undefined,
          })),
        }),
      });

      if (res.ok) {
        router.push("/transfers");
      } else {
        const d = await res.json();
        setError(d.error ?? "Error al crear transferencia");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/transfers"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nueva Transferencia</h2>
          <p className="text-sm text-gray-500">Entre sedes (San Miguel ↔ Lince)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Origen y Destino</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Sede Origen *</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={originSiteId} onChange={(e) => setOriginSiteId(e.target.value)} required>
                  <option value="">Seleccionar</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Sede Destino *</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={destinationSiteId} onChange={(e) => setDestinationSiteId(e.target.value)} required>
                  <option value="">Seleccionar</option>
                  {sites.filter((s) => s.id !== parseInt(originSiteId)).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {originSiteId && (
                <div className="space-y-1.5">
                  <Label>Almacén Origen</Label>
                  <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={originWarehouseId} onChange={(e) => setOriginWarehouseId(e.target.value)}>
                    <option value="">Sin especificar</option>
                    {originWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}
              {destinationSiteId && (
                <div className="space-y-1.5">
                  <Label>Almacén Destino</Label>
                  <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={destinationWarehouseId} onChange={(e) => setDestinationWarehouseId(e.target.value)}>
                    <option value="">Sin especificar</option>
                    {destWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Fecha planificada</Label>
              <Input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Productos ({items.length})</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4" />Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Agregue productos a transferir</p>}
            {items.map((item, idx) => (
              <div key={item.tempId} className="p-3 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Ítem {idx + 1}</p>
                  <button type="button" onClick={() => removeItem(item.tempId)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label>Producto *</Label>
                  <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={item.productId} onChange={(e) => handleProductSelect(item.tempId, e.target.value)}>
                    <option value="">Seleccionar</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cantidad *</Label>
                    <Input type="number" min="0" step="any" value={item.requestedQuantity} onChange={(e) => updateItem(item.tempId, { requestedQuantity: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unidad *</Label>
                    <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={item.unitId} onChange={(e) => updateItem(item.tempId, { unitId: e.target.value })}>
                      <option value="">Seleccionar</option>
                      {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4" />{error}
          </div>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creando..." : "Crear Transferencia"}
        </Button>
      </form>
    </div>
  );
}
