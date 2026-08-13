"use client";
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, Package, ShoppingCart, Trash2, ArrowLeftRight, Factory } from "lucide-react";

type InventoryBalance = {
  quantity: string;
  product: { name: string; code: string } | null;
  site: { name: string } | null;
  unit: { symbol: string } | null;
};

type WasteRecord = {
  quantity: string;
  stage: string;
  site: { name: string } | null;
  area: { name: string } | null;
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function ReportsPage() {
  const [balances, setBalances] = useState<InventoryBalance[]>([]);
  const [waste, setWaste] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/inventory").then((r) => r.json()),
      fetch("/api/waste").then((r) => r.json()),
    ]).then(([invData, wasteData]) => {
      setBalances(invData.balances ?? []);
      setWaste(wasteData.waste ?? []);
      setLoading(false);
    });
  }, []);

  // Process data for charts
  const stockBySite = balances.reduce((acc: Record<string, number>, b) => {
    const site = b.site?.name ?? "Sin sede";
    acc[site] = (acc[site] ?? 0) + parseFloat(b.quantity);
    return acc;
  }, {});

  const stockBySiteData = Object.entries(stockBySite).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  const wasteByStage = waste.reduce((acc: Record<string, number>, w) => {
    const stageLabels: Record<string, string> = {
      STORAGE: "Almacén", PRODUCTION: "Producción", PREPARATION: "Preparación",
      SERVICE: "Servicio", RETURN: "Devolución", OTHER: "Otro"
    };
    const label = stageLabels[w.stage] ?? w.stage;
    acc[label] = (acc[label] ?? 0) + parseFloat(w.quantity);
    return acc;
  }, {});
  const wasteByStageData = Object.entries(wasteByStage).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  const wasteByArea = waste.reduce((acc: Record<string, number>, w) => {
    const area = w.area?.name ?? w.site?.name ?? "Sin área";
    acc[area] = (acc[area] ?? 0) + parseFloat(w.quantity);
    return acc;
  }, {});
  const wasteByAreaData = Object.entries(wasteByArea).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

  const totalStock = balances.reduce((sum, b) => sum + parseFloat(b.quantity), 0);
  const totalWaste = waste.reduce((sum, w) => sum + parseFloat(w.quantity), 0);

  if (loading) {
    return <div className="p-6 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Reportes Operativos</h2>
        <p className="text-sm text-gray-500">Resumen gerencial de la operación</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Stock total", value: totalStock.toFixed(0) + " u.", icon: Package, color: "text-blue-600 bg-blue-50" },
          { label: "Total mermas", value: totalWaste.toFixed(2) + " u.", icon: Trash2, color: "text-red-600 bg-red-50" },
          { label: "Sedes con stock", value: Object.keys(stockBySite).length, icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Tipos de merma", value: Object.keys(wasteByStage).length, icon: Factory, color: "text-purple-600 bg-purple-50" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                  <p className="text-xl font-bold mt-1 text-gray-900">{kpi.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="inventory">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="waste">Mermas</TabsTrigger>
          <TabsTrigger value="detail">Detalle Stock</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Stock por sede</CardTitle></CardHeader>
            <CardContent>
              {stockBySiteData.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">Sin datos de inventario</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stockBySiteData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Unidades" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waste" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Mermas por etapa</CardTitle></CardHeader>
              <CardContent>
                {wasteByStageData.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Sin mermas registradas</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={wasteByStageData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                        {wasteByStageData.map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Mermas por área</CardTitle></CardHeader>
              <CardContent>
                {wasteByAreaData.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">Sin datos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={wasteByAreaData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} name="Cantidad" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detail" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Detalle de stock por producto</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase">Sede</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 uppercase">Unidad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {balances.slice(0, 50).map((b, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2 px-3 text-gray-500 font-mono text-xs">{b.product?.code}</td>
                        <td className="py-2 px-3 text-gray-900 font-medium">{b.product?.name}</td>
                        <td className="py-2 px-3 text-gray-500">{b.site?.name}</td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900">{parseFloat(b.quantity).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-gray-500">{b.unit?.symbol}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {balances.length === 0 && (
                  <p className="text-center text-gray-400 py-8 text-sm">Sin datos de inventario</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
