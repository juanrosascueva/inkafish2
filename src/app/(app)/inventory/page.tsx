"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, AlertTriangle, Package, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";

type Balance = {
  id: number;
  quantity: string;
  updatedAt: string;
  product: { id: number; name: string; code: string; minStock: string | null } | null;
  site: { id: number; name: string } | null;
  warehouse: { id: number; name: string } | null;
  unit: { id: number; name: string; symbol: string } | null;
};

type Lot = {
  id: number;
  lotNumber: string;
  receivedQuantity: string;
  remainingQuantity: string;
  receivedAt: string;
  expiresAt: string | null;
  active: boolean;
  product: { id: number; name: string; code: string } | null;
  site: { id: number; name: string } | null;
  warehouse: { id: number; name: string } | null;
};

type Movement = {
  id: number;
  movementType: string;
  quantity: string;
  referenceType: string | null;
  referenceId: number | null;
  reason: string | null;
  createdAt: string;
  product: { id: number; name: string; code: string } | null;
  unit: { id: number; symbol: string } | null;
  site: { id: number; name: string } | null;
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

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filteredBalances = balances.filter(
    (b) =>
      b.product?.name.toLowerCase().includes(search.toLowerCase()) ||
      b.product?.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLots = lots.filter(
    (l) =>
      l.lotNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.product?.name.toLowerCase().includes(search.toLowerCase())
  );

  const criticalLots = lots.filter(
    (l) => l.expiresAt && new Date(l.expiresAt) <= sevenDays && parseFloat(l.remainingQuantity) > 0
  );

  const criticalStock = balances.filter(
    (b) => b.product?.minStock && parseFloat(b.quantity) <= parseFloat(b.product.minStock)
  );

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventario</h2>
          <p className="text-sm text-gray-500">{balances.length} productos con stock</p>
        </div>
        <Link href="/warehouse">
          <Button>
            <Plus className="h-4 w-4" />
            Entrada de almacén
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
                <p className="text-xs text-amber-600">{criticalStock.length} productos bajo mínimo</p>
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
          placeholder="Buscar producto..."
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
                const isCritical = b.product?.minStock && parseFloat(b.quantity) <= parseFloat(b.product.minStock);
                return (
                  <Card key={b.id} className={cn(isCritical && "border-amber-200 bg-amber-50/30")}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{b.product?.name}</p>
                            {isCritical && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-400">{b.product?.code} · {b.site?.name} · {b.warehouse?.name ?? "Sin almacén"}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-lg font-bold", isCritical ? "text-amber-600" : "text-gray-900")}>
                            {parseFloat(b.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">{b.unit?.symbol}</p>
                        </div>
                      </div>
                      {b.product?.minStock && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Stock mín: {b.product.minStock}</span>
                            <span>Actual: {parseFloat(b.quantity).toFixed(2)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", isCritical ? "bg-amber-500" : "bg-green-500")}
                              style={{ width: `${Math.min(100, (parseFloat(b.quantity) / parseFloat(b.product.minStock)) * 100)}%` }}
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
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{lot.lotNumber}</p>
                              {isExpired && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">Vencido</span>}
                              {!isExpired && isExpiringSoon && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">⚠️ Por vencer</span>}
                            </div>
                            <p className="text-xs text-gray-600 mt-0.5">{lot.product?.name}</p>
                            <p className="text-xs text-gray-400">{lot.site?.name} · {lot.warehouse?.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{parseFloat(lot.remainingQuantity).toFixed(2)}</p>
                            <p className="text-xs text-gray-400">de {parseFloat(lot.receivedQuantity).toFixed(2)}</p>
                            {lot.expiresAt && (
                              <p className={cn("text-xs mt-1", isExpired ? "text-red-600" : isExpiringSoon ? "text-orange-600" : "text-gray-500")}>
                                Vence: {formatDate(lot.expiresAt)}
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
          ) : (
            <div className="space-y-2">
              {movements.map((m) => {
                const qty = parseFloat(m.quantity);
                return (
                  <Card key={m.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{m.product?.name}</p>
                          <p className="text-xs text-gray-500">{movementLabels[m.movementType] ?? m.movementType}</p>
                          <p className="text-xs text-gray-400">{formatDateTime(m.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-lg font-bold", qty >= 0 ? "text-green-600" : "text-red-600")}>
                            {qty >= 0 ? "+" : ""}{qty.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">{m.unit?.symbol}</p>
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
