"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stageOptions = [
  { value: "STORAGE", label: "Almacenamiento" },
  { value: "PRODUCTION", label: "Producción" },
  { value: "PREPARATION", label: "Preparación/Cocina" },
  { value: "SERVICE", label: "Servicio" },
  { value: "RETURN", label: "Devolución" },
  { value: "OTHER", label: "Otro" },
];

type MasterData = {
  sites: { id: number; name: string }[];
  areas: { id: number; name: string; siteId: number }[];
  units: { id: number; name: string; symbol: string }[];
  warehouses: { id: number; name: string; siteId: number }[];
};

type Product = { id: number; name: string; code: string };

export default function NewWastePage() {
  const router = useRouter();
  const [master, setMaster] = useState<MasterData>({ sites: [], areas: [], units: [], warehouses: [] });
  const [products, setProducts] = useState<Product[]>([]);

  const [productId, setProductId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [stage, setStage] = useState("STORAGE");
  const [cause, setCause] = useState("");
  const [siteId, setSiteId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const filteredAreas = master.areas.filter((a) => !siteId || a.siteId === parseInt(siteId));
  const filteredWarehouses = master.warehouses.filter((w) => !siteId || w.siteId === parseInt(siteId));

  useEffect(() => {
    fetch("/api/master").then((r) => r.json()).then(setMaster);
    fetch("/api/products?active=true").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!productId || !unitId || !quantity || !stage || !cause || !siteId) {
      setError("Complete todos los campos obligatorios");
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/waste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: parseInt(productId),
          unitId: parseInt(unitId),
          quantity: qty,
          stage,
          cause,
          areaId: areaId ? parseInt(areaId) : undefined,
          siteId: parseInt(siteId),
          warehouseId: warehouseId ? parseInt(warehouseId) : undefined,
          occurredAt,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setProductId("");
        setQuantity("");
        setCause("");
        setNotes("");
      } else {
        const d = await res.json();
        setError(d.error ?? "Error al registrar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/waste"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Registrar Merma</h2>
          <p className="text-sm text-gray-500">Desperdicio o pérdida de producto</p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
          ✅ Merma registrada correctamente.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Datos de la merma</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Sede *</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={siteId} onChange={(e) => { setSiteId(e.target.value); setAreaId(""); setWarehouseId(""); }} required>
                  <option value="">Seleccionar</option>
                  {master.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Área</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                  <option value="">Sin área</option>
                  {filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Etapa *</Label>
              <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={stage} onChange={(e) => setStage(e.target.value)} required>
                {stageOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Producto *</Label>
              <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={productId} onChange={(e) => setProductId(e.target.value)} required>
                <option value="">Seleccionar</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Cantidad *</Label>
                <Input type="number" min="0.001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" required />
              </div>
              <div className="space-y-1.5">
                <Label>Unidad *</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={unitId} onChange={(e) => setUnitId(e.target.value)} required>
                  <option value="">Seleccionar</option>
                  {master.units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Causa *</Label>
              <Input value={cause} onChange={(e) => setCause(e.target.value)} placeholder="Ej: Producto vencido, daño en manipulación..." required />
            </div>

            <div className="space-y-1.5">
              <Label>Fecha y hora *</Label>
              <Input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>Notas adicionales</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800 font-medium">⚠️ Regla anti-doble descuento</p>
              <p className="text-xs text-amber-700 mt-1">
                Si esta merma proviene de material ya consumido en producción, registrarla desde la orden de producción para evitar doble descuento de inventario.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4" />{error}
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Registrando..." : "Registrar Merma"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
