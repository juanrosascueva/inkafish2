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
type Area = { id: number; name: string; siteId: number };
type Product = { id: number; name: string; code: string; unit: { id: number; name: string; symbol: string } | null };
type Unit = { id: number; name: string; symbol: string };
type Warehouse = { id: number; name: string; siteId: number };

export default function NewProductionPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [siteId, setSiteId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [shift, setShift] = useState("");
  const [notes, setNotes] = useState("");
  const [inputs, setInputs] = useState<{ tempId: string; productId: string; unitId: string; plannedQuantity: string; warehouseId: string }[]>([]);
  const [outputs, setOutputs] = useState<{ tempId: string; outputProductId: string; unitId: string; quantity: string; destinationWarehouseId: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filteredAreas = areas.filter((a) => !siteId || a.siteId === parseInt(siteId));
  const filteredWarehouses = warehouses.filter((w) => !siteId || w.siteId === parseInt(siteId));

  useEffect(() => {
    fetch("/api/master").then((r) => r.json()).then((d) => {
      setSites(d.sites ?? []);
      setAreas(d.areas ?? []);
      setUnits(d.units ?? []);
      setWarehouses(d.warehouses ?? []);
    });
    fetch("/api/products?active=true").then((r) => r.json()).then((d) => setProducts(d.products ?? []));
  }, []);

  const addInput = () => setInputs((p) => [...p, { tempId: Math.random().toString(36).slice(2), productId: "", unitId: "", plannedQuantity: "", warehouseId: "" }]);
  const addOutput = () => setOutputs((p) => [...p, { tempId: Math.random().toString(36).slice(2), outputProductId: "", unitId: "", quantity: "", destinationWarehouseId: "" }]);
  const removeInput = (tid: string) => setInputs((p) => p.filter((i) => i.tempId !== tid));
  const removeOutput = (tid: string) => setOutputs((p) => p.filter((i) => i.tempId !== tid));
  const updateInput = (tid: string, u: Partial<typeof inputs[0]>) => setInputs((p) => p.map((i) => i.tempId === tid ? { ...i, ...u } : i));
  const updateOutput = (tid: string, u: Partial<typeof outputs[0]>) => setOutputs((p) => p.map((i) => i.tempId === tid ? { ...i, ...u } : i));

  const handleProductSelect = (tid: string, pId: string, type: "input" | "output") => {
    const p = products.find((p) => p.id === parseInt(pId));
    if (type === "input") updateInput(tid, { productId: pId, unitId: p?.unit?.id ? String(p.unit.id) : "" });
    else updateOutput(tid, { outputProductId: pId, unitId: p?.unit?.id ? String(p.unit.id) : "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!siteId || !plannedDate) {
      setError("Sede y fecha son obligatorios");
      return;
    }

    const validInputs = inputs.filter((i) => i.productId && i.unitId && parseFloat(i.plannedQuantity) > 0);
    const validOutputs = outputs.filter((o) => o.outputProductId && o.unitId && parseFloat(o.quantity) > 0);

    if (validInputs.length === 0 || validOutputs.length === 0) {
      setError("Debe tener al menos 1 insumo y 1 producto resultante");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: parseInt(siteId),
          productionAreaId: areaId ? parseInt(areaId) : undefined,
          plannedDate,
          shift: shift || undefined,
          notes: notes || undefined,
          inputs: validInputs.map((i) => ({
            productId: parseInt(i.productId),
            unitId: parseInt(i.unitId),
            plannedQuantity: parseFloat(i.plannedQuantity),
            warehouseId: i.warehouseId ? parseInt(i.warehouseId) : undefined,
          })),
          outputs: validOutputs.map((o) => ({
            outputProductId: parseInt(o.outputProductId),
            unitId: parseInt(o.unitId),
            quantity: parseFloat(o.quantity),
            destinationWarehouseId: o.destinationWarehouseId ? parseInt(o.destinationWarehouseId) : undefined,
          })),
        }),
      });

      if (res.ok) {
        router.push("/production");
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
        <Link href="/production"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Nueva Orden de Producción</h2>
          <p className="text-sm text-gray-500">Transformación de materias primas</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Datos generales</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Sede *</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={siteId} onChange={(e) => { setSiteId(e.target.value); setAreaId(""); }} required>
                  <option value="">Seleccionar</option>
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Área</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                  <option value="">Sin área específica</option>
                  {filteredAreas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Fecha planificada *</Label>
                <Input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Turno</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={shift} onChange={(e) => setShift(e.target.value)}>
                  <option value="">Sin turno</option>
                  <option value="MAÑANA">Mañana</option>
                  <option value="TARDE">Tarde</option>
                  <option value="NOCHE">Noche</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Insumos (Entrada)</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Materias primas a consumir</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addInput}><Plus className="h-4 w-4" />Agregar</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {inputs.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Agregue insumos a consumir</p>}
            {inputs.map((inp, idx) => (
              <div key={inp.tempId} className="p-3 border border-blue-100 bg-blue-50/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-blue-700">Insumo {idx + 1}</p>
                  <button type="button" onClick={() => removeInput(inp.tempId)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="space-y-1.5">
                  <Label>Producto *</Label>
                  <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={inp.productId} onChange={(e) => handleProductSelect(inp.tempId, e.target.value, "input")}>
                    <option value="">Seleccionar</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cantidad planificada *</Label>
                    <Input type="number" min="0" step="any" value={inp.plannedQuantity} onChange={(e) => updateInput(inp.tempId, { plannedQuantity: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unidad *</Label>
                    <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={inp.unitId} onChange={(e) => updateInput(inp.tempId, { unitId: e.target.value })}>
                      <option value="">Seleccionar</option>
                      {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Outputs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Productos Resultantes (Salida)</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Productos que se generarán</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addOutput}><Plus className="h-4 w-4" />Agregar</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {outputs.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Agregue productos resultantes</p>}
            {outputs.map((out, idx) => (
              <div key={out.tempId} className="p-3 border border-green-100 bg-green-50/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-green-700">Resultado {idx + 1}</p>
                  <button type="button" onClick={() => removeOutput(out.tempId)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="space-y-1.5">
                  <Label>Producto resultante *</Label>
                  <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={out.outputProductId} onChange={(e) => handleProductSelect(out.tempId, e.target.value, "output")}>
                    <option value="">Seleccionar</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cantidad esperada *</Label>
                    <Input type="number" min="0" step="any" value={out.quantity} onChange={(e) => updateOutput(out.tempId, { quantity: e.target.value })} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unidad *</Label>
                    <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={out.unitId} onChange={(e) => updateOutput(out.tempId, { unitId: e.target.value })}>
                      <option value="">Seleccionar</option>
                      {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Almacén destino</Label>
                  <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={out.destinationWarehouseId} onChange={(e) => updateOutput(out.tempId, { destinationWarehouseId: e.target.value })}>
                    <option value="">Sin almacén específico</option>
                    {filteredWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><AlertTriangle className="h-4 w-4" />{error}</div>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creando..." : "Crear Orden de Producción"}
        </Button>
      </form>
    </div>
  );
}
