"use client";
import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";

type ProductionOrder = {
  id: number;
  productionOrderNumber: string;
  status: string;
  plannedDate: string;
  shift: string | null;
  totalInputQuantity: string | null;
  totalOutputQuantity: string | null;
  wasteQuantity: string | null;
  yieldPercentage: string | null;
  notes: string | null;
};

type ProductionInput = {
  id: number;
  plannedQuantity: string | null;
  actualQuantity: string | null;
  product: { id: number; name: string; code: string } | null;
  unit: { id: number; name: string; symbol: string } | null;
};

type ProductionOutput = {
  id: number;
  quantity: string;
  product: { id: number; name: string; code: string } | null;
  unit: { id: number; name: string; symbol: string } | null;
};

type WasteRecord = {
  id: number;
  quantity: string;
  stage: string;
  cause: string;
  consumesStock: boolean;
  product: { id: number; name: string } | null;
  unit: { id: number; symbol: string } | null;
};

export default function ProductionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [inputs, setInputs] = useState<ProductionInput[]>([]);
  const [outputs, setOutputs] = useState<ProductionOutput[]>([]);
  const [wastes, setWastes] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Complete mode
  const [completeMode, setCompleteMode] = useState(false);
  const [actualInputs, setActualInputs] = useState<{ id: number; actualQuantity: string }[]>([]);
  const [actualOutputs, setActualOutputs] = useState<{ id: number; quantity: string }[]>([]);
  const [wasteCause, setWasteCause] = useState("Merma de producción");

  const fetchOrder = async () => {
    const res = await fetch(`/api/production/${id}`);
    if (res.ok) {
      const d = await res.json();
      setOrder(d.order);
      setInputs(d.inputs ?? []);
      setOutputs(d.outputs ?? []);
      setWastes(d.wastes ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const startComplete = () => {
    setActualInputs(inputs.map((i) => ({ id: i.id, actualQuantity: i.plannedQuantity ?? "" })));
    setActualOutputs(outputs.map((o) => ({ id: o.id, quantity: o.quantity })));
    setCompleteMode(true);
  };

  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/production/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        setCompleteMode(false);
        await fetchOrder();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitComplete = () => {
    const validInputs = actualInputs.filter((i) => parseFloat(i.actualQuantity) > 0);
    const validOutputs = actualOutputs.filter((o) => parseFloat(o.quantity) > 0);

    const totalIn = validInputs.reduce((s, i) => s + parseFloat(i.actualQuantity), 0);
    const totalOut = validOutputs.reduce((s, o) => s + parseFloat(o.quantity), 0);
    const waste = Math.max(0, totalIn - totalOut);

    handleAction("complete", {
      actualInputs: validInputs.map((i) => ({ id: i.id, actualQuantity: parseFloat(i.actualQuantity) })),
      actualOutputs: validOutputs.map((o) => ({ id: o.id, quantity: parseFloat(o.quantity) })),
      wasteQuantity: waste,
      wasteCause,
    });
  };

  if (loading) return <div className="p-6 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  if (!order) return <div className="p-6 text-center"><p className="text-gray-500">Orden no encontrada</p><Link href="/production"><Button className="mt-3" variant="outline">Volver</Button></Link></div>;

  const totalIn = actualInputs.reduce((s, i) => s + (parseFloat(i.actualQuantity) || 0), 0);
  const totalOut = actualOutputs.reduce((s, o) => s + (parseFloat(o.quantity) || 0), 0);
  const estimatedWaste = Math.max(0, totalIn - totalOut);
  const estimatedYield = totalIn > 0 ? (totalOut / totalIn) * 100 : 0;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/production"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{order.productionOrderNumber}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStatusColor(order.status))}>
              {getStatusLabel(order.status)}
            </span>
            <span className="text-xs text-gray-500">Planificada: {formatDate(order.plannedDate)}</span>
          </div>
        </div>
      </div>

      {order.notes && (
        <Card><CardContent className="p-3 text-sm text-gray-700">{order.notes}</CardContent></Card>
      )}

      {/* Inputs */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base text-blue-700">📥 Insumos (Entrada)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {inputs.map((inp, idx) => (
            <div key={inp.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{inp.product?.name}</p>
                <p className="text-xs text-gray-400">{inp.product?.code}</p>
              </div>
              {completeMode ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    className="w-24 h-8 text-sm"
                    value={actualInputs.find((a) => a.id === inp.id)?.actualQuantity ?? ""}
                    onChange={(e) => setActualInputs((prev) => prev.map((a) => a.id === inp.id ? { ...a, actualQuantity: e.target.value } : a))}
                  />
                  <span className="text-xs text-gray-500">{inp.unit?.symbol}</span>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{inp.actualQuantity ?? inp.plannedQuantity} {inp.unit?.symbol}</p>
                  {inp.actualQuantity && inp.plannedQuantity && inp.actualQuantity !== inp.plannedQuantity && (
                    <p className="text-xs text-gray-400">Planificado: {inp.plannedQuantity}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Outputs */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base text-green-700">📤 Productos Resultantes (Salida)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {outputs.map((out) => (
            <div key={out.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{out.product?.name}</p>
                <p className="text-xs text-gray-400">{out.product?.code}</p>
              </div>
              {completeMode ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    className="w-24 h-8 text-sm"
                    value={actualOutputs.find((a) => a.id === out.id)?.quantity ?? ""}
                    onChange={(e) => setActualOutputs((prev) => prev.map((a) => a.id === out.id ? { ...a, quantity: e.target.value } : a))}
                  />
                  <span className="text-xs text-gray-500">{out.unit?.symbol}</span>
                </div>
              ) : (
                <p className="text-sm font-bold text-green-700">{out.quantity} {out.unit?.symbol}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Yield preview in complete mode */}
      {completeMode && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-4 space-y-2">
            <h3 className="text-sm font-semibold text-amber-800">Vista previa de rendimiento</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-xs text-gray-500">Entrada total</p><p className="text-lg font-bold">{totalIn.toFixed(2)}</p></div>
              <div><p className="text-xs text-gray-500">Salida total</p><p className="text-lg font-bold text-green-600">{totalOut.toFixed(2)}</p></div>
              <div><p className="text-xs text-gray-500">Merma analítica</p><p className="text-lg font-bold text-red-600">{estimatedWaste.toFixed(2)}</p></div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, estimatedYield)}%` }} />
            </div>
            <p className="text-center text-sm font-medium text-gray-700">Rendimiento estimado: {estimatedYield.toFixed(1)}%</p>
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
              ⚠️ La merma analítica no descuenta stock adicional (ya fue consumido en la entrada).
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Causa de merma</label>
              <Input className="h-8 text-sm" value={wasteCause} onChange={(e) => setWasteCause(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wastes */}
      {wastes.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base text-red-700">🗑️ Mermas registradas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {wastes.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-2 bg-red-50 border border-red-100 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{w.product?.name}</p>
                  <p className="text-xs text-gray-500">{w.cause}</p>
                  {!w.consumesStock && <p className="text-xs text-amber-600">Analítica (no descuenta stock)</p>}
                </div>
                <p className="text-sm font-bold text-red-600">{w.quantity} {w.unit?.symbol}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed stats */}
      {order.status === "COMPLETED" && order.yieldPercentage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Entrada total</p>
              <p className="text-xl font-bold text-gray-900">{order.totalInputQuantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Salida total</p>
              <p className="text-xl font-bold text-green-700">{order.totalOutputQuantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Merma</p>
              <p className="text-xl font-bold text-red-600">{order.wasteQuantity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rendimiento</p>
              <p className="text-xl font-bold text-blue-700">{parseFloat(order.yieldPercentage).toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {order.status === "PLANNED" && (
          <Button onClick={() => handleAction("start")} disabled={submitting} className="w-full" variant="default">
            <Play className="h-4 w-4" />Iniciar producción
          </Button>
        )}
        {order.status === "IN_PROGRESS" && !completeMode && (
          <Button onClick={startComplete} className="w-full" variant="success">
            <CheckCircle className="h-4 w-4" />Completar y registrar cantidades
          </Button>
        )}
        {completeMode && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCompleteMode(false)} className="flex-1">Cancelar</Button>
            <Button onClick={submitComplete} disabled={submitting} variant="success" className="flex-1">
              Confirmar completado
            </Button>
          </div>
        )}
        {["PLANNED", "IN_PROGRESS"].includes(order.status) && (
          <Button
            onClick={() => handleAction("cancel")}
            disabled={submitting}
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
          >
            <XCircle className="h-4 w-4" />Cancelar orden
          </Button>
        )}
      </div>
    </div>
  );
}
