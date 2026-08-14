"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { UserIdentityBadge, UserProfile } from "@/components/ui/user-identity-badge";
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
type Product = { id: string | number; code: string; name: string; unit: { id: string | number; name: string; symbol: string } | null; category?: { name: string } };

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

  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: p.name,
    code: p.code,
    sublabel: p.unit?.symbol || "UND",
  }));

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
        <SkeletonList count={3} />
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
                      <span className="text-xs text-[#1b6970] font-medium flex items-center gap-1">Ver detalle <ArrowRight className="h-3 w-3" /></span>
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
          <UserIdentityBadge
            onUserLoaded={(u) => {
              if (u.siteId && !siteId) setSiteId(String(u.siteId));
            }}
          />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Proveedor *</Label>
                <CustomSelect
                  options={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
                  value={supplierId}
                  onChange={setSupplierId}
                  placeholder="Seleccionar proveedor"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Sede Destino *</Label>
                <CustomSelect
                  options={sites.map((s) => ({ value: String(s.id), label: s.name }))}
                  value={siteId}
                  onChange={(val) => {
                    setSiteId(val);
                    setWarehouseId("");
                  }}
                  placeholder="Seleccionar sede"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Almacén Destino *</Label>
                <CustomSelect
                  options={filteredWarehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                  value={warehouseId}
                  onChange={setWarehouseId}
                  placeholder="Seleccionar almacén"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Fecha Esperada de Entrega</Label>
                <CustomDatePicker value={expectedDate} onChange={setExpectedDate} />
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
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <SearchableSelect
                        options={productOptions}
                        value={item.productId}
                        onChange={(val) => handleProductChange(idx, val)}
                        placeholder="Buscar o seleccionar insumo..."
                        searchPlaceholder="Escribe el nombre o código..."
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="flex-1 sm:w-24">
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
                          className="h-10 text-xs"
                          required
                        />
                      </div>
                      <div className="flex-1 sm:w-28">
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
                          className="h-10 text-xs"
                          required
                        />
                      </div>
                      {items.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)} className="h-10 w-10 p-0 text-red-500 hover:text-red-700 flex-shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <p className="text-sm font-bold text-gray-900">
                  Total Estimado: <span className="text-[#1b6970]">{formatCurrency(calculatedTotal, "PEN")}</span>
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
