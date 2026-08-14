"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";

type Balance = {
  id: string | number;
  quantity: number | string;
  updatedAt: number | string;
  product: { id: string | number; name: string; code: string; minStock: number | string | null } | null;
  site: { id: string | number; name: string } | null;
  warehouse: { id: string | number; name: string } | null;
  unit: { id: string | number; name: string; symbol: string } | null;
};

type Lot = {
  id: string | number;
  lotNumber: string;
  receivedQuantity: number | string;
  remainingQuantity: number | string;
  receivedAt: number | string;
  expiresAt: number | string | null;
  active: boolean;
  product: { id: string | number; name: string; code: string } | null;
  site: { id: string | number; name: string } | null;
  warehouse: { id: string | number; name: string } | null;
};

type Movement = {
  id: string | number;
  movementType: string;
  quantity: number | string;
  referenceType: string | null;
  referenceId: number | string | null;
  reason: string | null;
  createdAt: number | string;
  product: { id: string | number; name: string; code: string } | null;
  unit: { id: string | number; symbol: string } | null;
  site: { id: string | number; name: string } | null;
};

const movementLabels: Record<string, string> = {
  PURCHASE_RECEIPT: "Recepción de compra",
  WAREHOUSE_ENTRY: "Entrada de almacén",
  INTERNAL_DISPATCH: "Despacho interno",
  INTERNAL_RECEIPT: "Recepción interna",
  TRANSFER_OUT: "Salida por transferencia",
  TRANSFER_IN: "Entrada por transferencia",
  PRODUCTION_CONSUMPTION: "Consumo producción",
  PRODUCTION_OUTPUT: "Salida producción",
  WASTE: "Merma",
  RETURN: "Devolución",
  ADJUSTMENT_POSITIVE: "Ajuste positivo",
  ADJUSTMENT_NEGATIVE: "Ajuste negativo",
  REVERSAL: "Reverso",
};

export default function InventoryPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("balances");

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory").then((r) => r.json()),
      fetch("/api/inventory?type=lots").then((r) => r.json()),
      fetch("/api/inventory?type=movements").then((r) => r.json()),
    ]).then(([balData, lotsData, movData]) => {
      setBalances(balData.balances ?? []);
      setLots(lotsData.lots ?? []);
      setMovements(movData.movements ?? []);
      setLoading(false);
    });
  }, []);

  const parseVal = (v: any) => (typeof v === "number" ? v : parseFloat(v) || 0);

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filteredBalances = balances.filter(
    (b) =>
      b.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.product?.code?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLots = lots.filter(
    (l) =>
      l.lotNumber?.toLowerCase().includes(search.toLowerCase()) ||
      l.product?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const criticalLots = lots.filter(
    (l) => l.expiresAt && new Date(l.expiresAt) <= sevenDays && parseVal(l.remainingQuantity) > 0
  );

  const criticalStock = balances.filter(
    (b) => b.product?.minStock !== null && b.product?.minStock !== undefined && parseVal(b.quantity) <= parseVal(b.product.minStock)
  );

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventario</h2>
          <p className="text-sm text-gray-500">{balances.length} productos con stock activo</p>
        </div>
        <Link href="/warehouse">
          <Button>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Entrada de almacén</span><span className="sm:hidden">Entrada</span>
          </Button>
        </Link>
      </div>

      {/* Alerts */}
      {(criticalStock.length > 0 || criticalLots.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {criticalStock.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">Stock crítico</p>
                <p className="text-xs text-amber-600">{criticalStock.length} productos bajo el mínimo</p>
              </div>
            </div>
          )}
          {criticalLots.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
              <Calendar className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Próximos a vencer</p>
                <p className="text-xs text-red-600">{criticalLots.length} lotes en 7 días (FEFO)</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar insumo o producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="balances">Saldos ({balances.length})</TabsTrigger>
          <TabsTrigger value="lots">Lotes ({lots.length})</TabsTrigger>
          <TabsTrigger value="movements">Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="mt-4">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-white rounded-xl border animate-pulse" />)}
            </div>
          ) : filteredBalances.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-gray-400 text-sm">Sin registros de inventario</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filteredBalances.map((b) => {
                const qty = parseVal(b.quantity);
                const min = b.product?.minStock !== null && b.product?.minStock !== undefined ? parseVal(b.product.minStock) : null;
                const isCritical = min !== null && qty <= min;

                return (
                  <Card key={b.id} className={cn(isCritical && "border-amber-200 bg-amber-50/30")}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">{b.product?.name || "Producto"}</p>
                            {isCritical && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-400 truncate">
                            {b.product?.code} · {b.site?.name || "Sede"} · {b.warehouse?.name || "Almacén Principal"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-lg font-bold", isCritical ? "text-amber-600" : "text-gray-900")}>
                            {qty.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">{b.unit?.symbol || "UND"}</p>
                        </div>
                      </div>
                      {min !== null && min > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Mínimo: {min}</span>
                            <span>Actual: {qty.toFixed(2)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", isCritical ? "bg-amber-500" : "bg-green-500")}
                              style={{ width: `${Math.min(100, (qty / min) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lots" className="mt-4">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl border animate-pulse" />)}</div>
          ) : filteredLots.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-gray-400 text-sm">Sin lotes registrados</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {filteredLots
                .sort((a, b) => {
                  if (!a.expiresAt) return 1;
                  if (!b.expiresAt) return -1;
                  return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
                })
                .map((lot) => {
                  const rem = parseVal(lot.remainingQuantity);
                  const rec = parseVal(lot.receivedQuantity);
                  const isExpiringSoon = lot.expiresAt && new Date(lot.expiresAt) <= sevenDays;
                  const isExpired = lot.expiresAt && new Date(lot.expiresAt) < now;

                  return (
                    <Card key={lot.id} className={cn(
                      isExpired ? "border-red-200 bg-red-50/30" :
                      isExpiringSoon ? "border-orange-200 bg-orange-50/30" : ""
                    )}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-gray-900">{lot.lotNumber}</p>
                              {isExpired && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Vencido</span>}
                              {!isExpired && isExpiringSoon && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">⚠️ Por vencer</span>}
                            </div>
                            <p className="text-xs font-medium text-gray-700 mt-0.5">{lot.product?.name || "Producto"}</p>
                            <p className="text-xs text-gray-400">{lot.site?.name} · {lot.warehouse?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{rem.toFixed(2)}</p>
                            <p className="text-[11px] text-gray-400">recibido: {rec.toFixed(2)}</p>
                            {lot.expiresAt && (
                              <p className={cn("text-xs mt-0.5 font-medium", isExpired ? "text-red-600" : isExpiringSoon ? "text-orange-600" : "text-gray-500")}>
                                Vence: {formatDate(new Date(lot.expiresAt))}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl border animate-pulse" />)}</div>
          ) : movements.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-gray-400 text-sm">Sin movimientos de inventario</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {movements.map((m) => {
                const qty = parseVal(m.quantity);
                return (
                  <Card key={m.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{m.product?.name || "Producto"}</p>
                          <p className="text-xs text-gray-500">{movementLabels[m.movementType] ?? m.movementType}</p>
                          <p className="text-xs text-gray-400">{formatDateTime(new Date(m.createdAt))}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-base font-bold", qty >= 0 ? "text-green-600" : "text-red-600")}>
                            {qty >= 0 ? "+" : ""}{qty.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">{m.unit?.symbol || "UND"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
