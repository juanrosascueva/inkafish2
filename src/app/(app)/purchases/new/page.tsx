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
type Supplier = { id: number; name: string };
type Product = { id: number; name: string; code: string; unit: { id: number; name: string; symbol: string } | null };
type Unit = { id: number; name: string; symbol: string };

export default function NewPurchasePage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [supplierId, setSupplierId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ tempId: string; productId: string; unitId: string; quantity: string; unitPrice: string; notes: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/master").then((r) => r.json()).then((d) => { setSites(d.sites ?? []); setUnits(d.units ?? []); });
    fetch("/api/suppliers").then((r) => r.json()).then((d) => setSuppliers(d.suppliers ?? []));
    fetch("/api/products?active=true").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
  }, []);

  const addItem = () => setItems((prev) => [...prev, { tempId: Math.random().toString(36).slice(2), productId: "", unitId: "", quantity: "", unitPrice: "", notes: "" }]);
  const removeItem = (tid: string) => setItems((prev) => prev.filter((i) => i.tempId !== tid));
  const updateItem = (tid: string, updates: Partial<typeof items[0]>) => setItems((prev) => prev.map((i) => i.tempId === tid ? { ...i, ...updates } : i));

  const handleProductSelect = (tid: string, pId: string) => {
    const p = products.find((p) => p.id === parseInt(pId));
    updateItem(tid, { productId: pId, unitId: p?.unit?.id ? String(p.unit.id) : "" });
  };

  const total = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!supplierId || !siteId) {
      setError("Seleccione proveedor y sede");
      return;
    }
    const validItems = items.filter((i) => i.productId && i.unitId && parseFloat(i.quantity) > 0);
    if (validItems.length === 0) {
      setError("Agregue al menos un ítem válido");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: parseInt(supplierId),
          siteId: parseInt(siteId),
          expectedDate: expectedDate || undefined,
          documentNumber: documentNumber || undefined,
          notes: notes || undefined,
          items: validItems.map((i) => ({
            productId: parseInt(i.productId),
            unitId: parseInt(i.unitId),
            quantity: parseFloat(i.quantity),
            unitPrice: i.unitPrice ? parseFloat(i.unitPrice) : undefined,
            notes: i.notes || undefined,
          })),
        }),
      });

      if (res.ok) {
        router.push("/purchases");
      } else {
        const d = await res.json();
        setError(d.error ?? "Error al crear orden");
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
        <Link href="/purchases"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nueva Orden de Compra</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Datos generales</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Proveedor *</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Sede *</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={siteId} onChange={(e) => setSiteId(e.target.value)} required>
                  <option value="">Seleccionar sede</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha esperada</Label>
                <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>N° Documento</Label>
                <Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Ej: F001-000123" />
              </div>
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
              <CardTitle className="text-base">Productos</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-4 w-4" />Agregar</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.length === 0 && <p className="text-center text-gray-400 text-sm py-6">Agregue productos a comprar</p>}
            {items.map((item, idx) => (
              <div key={item.tempId} className="p-3 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Ítem {idx + 1}</p>
                  <button type="button" onClick={() => removeItem(item.tempId)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="space-y-1.5">
                  <Label>Producto *</Label>
                  <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={item.productId} onChange={(e) => handleProductSelect(item.tempId, e.target.value)}>
                    <option value="">Seleccionar</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cantidad *</Label>
                    <Input type="number" min="0" step="any" value={item.quantity} onChange={(e) => updateItem(item.tempId, { quantity: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unidad *</Label>
                    <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={item.unitId} onChange={(e) => updateItem(item.tempId, { unitId: e.target.value })}>
                      <option value="">Seleccionar</option>
                      {units.map((u) => <option key={u.id} value={u.id}>{u.symbol}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>P. Unit. S/</Label>
                    <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.tempId, { unitPrice: e.target.value })} placeholder="0.00" />
                  </div>
                </div>
                {item.quantity && item.unitPrice && (
                  <p className="text-xs text-right text-gray-600 font-medium">
                    Subtotal: S/ {(parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2)}
                  </p>
                )}
              </div>
            ))}
            {items.length > 0 && (
              <div className="pt-2 border-t border-gray-200 flex justify-between">
                <span className="text-sm font-medium text-gray-700">Total estimado:</span>
                <span className="text-base font-bold text-gray-900">S/ {total.toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertTriangle className="h-4 w-4" />{error}</div>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creando..." : "Crear Orden de Compra"}
        </Button>
      </form>
    </div>
  );
}
