"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn, getStatusColor, getStatusLabel, formatDate, formatCurrency } from "@/lib/utils";

type Purchase = {
  id: string | number;
  purchaseNumber: string;
  status: string;
  expectedDate: string | null;
  documentNumber: string | null;
  totalAmount: number | null;
  currency: string;
  notes: string | null;
  createdAt: number | string;
  supplier: { id: string | number; name: string } | null;
  warehouse: { id: string | number; name: string } | null;
};

type Supplier = { id: string | number; name: string };
type Site = { id: string | number; name: string };
type Warehouse = { id: string | number; name: string; siteId: string | number };
type Product = { id: string | number; code: string; name: string; unit: { id: string | number; name: string; symbol: string } | null };

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<{ productId: string; unitId: string; quantity: string; unitPrice: string }[]>([]);

  const fetchPurchases = () => {
    fetch("/api/purchases")
      .then((r) => r.json())
      .then((d) => setPurchases(d.purchases ?? []))
      .finally(() => setLoading(false));
  };

  const fetchMasterData = () => {
    Promise.all([
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/master").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([supData, masData, prodData]) => {
      setSuppliers(supData.suppliers ?? []);
      setSites(masData.sites ?? []);
      setWarehouses(masData.warehouses ?? []);
      setProducts(prodData.products ?? []);
      if (masData.sites?.length > 0) setSiteId(String(masData.sites[0].id));
    });
  };

  useEffect(() => {
    fetchPurchases();
    fetchMasterData();
  }, []);

  const totalActive = purchases.filter((p) => !["RECEIVED", "CANCELLED"].includes(p.status)).length;

  const handleOpenDialog = () => {
    setSupplierId("");
    setWarehouseId("");
    setExpectedDate("");
    setNotes("");
    setItems([{ productId: "", unitId: "", quantity: "1", unitPrice: "0" }]);
    setDialogOpen(true);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: "", unitId: "", quantity: "1", unitPrice: "0" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => String(p.id) === prodId);
    const newItems = [...items];
    newItems[index].productId = prodId;
    if (prod?.unit?.id) {
      newItems[index].unitId = String(prod.unit.id);
    }
    setItems(newItems);
  };

  const calculatedTotal = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const p = parseFloat(item.unitPrice) || 0;
    return sum + q * p;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !siteId || !warehouseId || items.length === 0) return;

    setSubmitting(true);
    try {
      const payload = {
        supplierId,
        siteId,
        warehouseId,
        expectedDate: expectedDate || undefined,
        notes: notes || undefined,
        currency: "PEN",
        items: items.map((i) => ({
          productId: i.productId,
          unitId: i.unitId,
          quantity: parseFloat(i.quantity) || 1,
          unitPrice: parseFloat(i.unitPrice) || 0,
        })),
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchPurchases();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWarehouses = warehouses.filter((w) => String(w.siteId) === siteId);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Órdenes de Compra</h2>
          <p className="text-sm text-gray-500">{purchases.length} registradas · {totalActive} en proceso</p>
        </div>
        <Button onClick={handleOpenDialog}>
          <Plus className="h-4 w-4" />Nueva Orden de Compra
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : purchases.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No hay órdenes de compra registradas</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => (
            <Link key={p.id} href={`/purchases/${p.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{p.purchaseNumber}</p>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStatusColor(p.status))}>
                          {getStatusLabel(p.status)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-0.5">{p.supplier?.name || "Sin proveedor"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Almacén: {p.warehouse?.name || "Almacén Principal"}
                        {p.expectedDate && ` · Esperada: ${formatDate(p.expectedDate)}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {p.totalAmount !== null && p.totalAmount !== undefined && (
                        <p className="text-base font-bold text-gray-900">{formatCurrency(p.totalAmount, p.currency || "PEN")}</p>
                      )}
                      <span className="text-xs text-blue-600 font-medium flex items-center gap-1">Ver detalle <ArrowRight className="h-3 w-3" /></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* New Purchase Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Orden de Compra</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Proveedor *</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Sede Destino *</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={siteId}
                  onChange={(e) => {
                    setSiteId(e.target.value);
                    setWarehouseId("");
                  }}
                  required
                >
                  {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Almacén Destino *</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar almacén</option>
                  {filteredWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Fecha Esperada de Entrega</Label>
                <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
              </div>
            </div>

            {/* Items table */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold text-gray-900">Ítems / Insumos a Comprar *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" />Agregar Insumo
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                    <div className="flex-1">
                      <select
                        className="w-full h-9 rounded-md border border-gray-300 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={item.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        required
                      >
                        <option value="">Seleccionar Insumo...</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min="0.001"
                        step="any"
                        placeholder="Cant."
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].quantity = e.target.value;
                          setItems(newItems);
                        }}
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="P. Unit (S/)"
                        value={item.unitPrice}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].unitPrice = e.target.value;
                          setItems(newItems);
                        }}
                        className="h-9 text-xs"
                        required
                      />
                    </div>
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="h-9 w-9 p-0 text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <p className="text-sm font-bold text-gray-900">
                  Total Estimado: <span className="text-blue-600">{formatCurrency(calculatedTotal, "PEN")}</span>
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Emitiendo..." : "Emitir Orden de Compra"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
