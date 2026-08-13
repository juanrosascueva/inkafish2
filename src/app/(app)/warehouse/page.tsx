"use client";
import React, { useEffect, useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MasterData = {
  sites: { id: number; name: string }[];
  units: { id: number; name: string; symbol: string; allowsDecimals: boolean }[];
  warehouses: { id: number; name: string; siteId: number }[];
};

type Product = {
  id: number;
  name: string;
  code: string;
  tracksLot: boolean;
  tracksExpiry: boolean;
  unit: { id: number; name: string; symbol: string; allowsDecimals: boolean } | null;
};

type Supplier = {
  id: number;
  name: string;
};

const originOptions = [
  { value: "SUPPLIER", label: "Proveedor" },
  { value: "TRANSFER", label: "Transferencia" },
  { value: "RETURN", label: "Devolución" },
  { value: "INITIAL_STOCK", label: "Stock inicial" },
  { value: "ADJUSTMENT", label: "Ajuste" },
  { value: "OTHER", label: "Otro" },
];

export default function WarehousePage() {
  const [master, setMaster] = useState<MasterData>({ sites: [], units: [], warehouses: [] });
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitId, setUnitId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [origin, setOrigin] = useState("SUPPLIER");
  const [supplierId, setSupplierId] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");

  const selectedProduct = products.find((p) => p.id === parseInt(productId));
  const filteredWarehouses = master.warehouses.filter((w) => !siteId || w.siteId === parseInt(siteId));

  useEffect(() => {
    Promise.all([
      fetch("/api/master").then((r) => r.json()),
      fetch("/api/products?active=true").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
    ]).then(([masterData, productsData, suppliersData]) => {
      setMaster(masterData);
      setProducts(productsData.products ?? []);
      setSuppliers(suppliersData.suppliers ?? []);
    });
  }, []);

  // Auto-select unit when product changes
  useEffect(() => {
    if (selectedProduct?.unit) {
      setUnitId(String(selectedProduct.unit.id));
    }
  }, [productId, selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!productId || !quantity || !unitId || !siteId) {
      setError("Complete los campos obligatorios");
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError("La cantidad debe ser mayor a 0");
      return;
    }

    // Validate decimals
    if (selectedProduct?.unit && !selectedProduct.unit.allowsDecimals && !Number.isInteger(qty)) {
      setError(`La unidad "${selectedProduct.unit.name}" no permite decimales`);
      return;
    }

    if (origin === "SUPPLIER" && !supplierId) {
      setError("El proveedor es obligatorio para origen Proveedor");
      return;
    }

    if (selectedProduct?.tracksExpiry && !expiresAt) {
      setError("La fecha de vencimiento es obligatoria para este producto");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: qty,
          unitId,
          siteId,
          warehouseId: warehouseId || undefined,
          movementType: origin === "SUPPLIER" ? "PURCHASE_RECEIPT" : "WAREHOUSE_ENTRY",
          reason: reason || undefined,
          lotNumber: (selectedProduct?.tracksLot && lotNumber) ? lotNumber : undefined,
          expiresAt: (selectedProduct?.tracksExpiry && expiresAt) ? expiresAt : undefined,
          supplierId: supplierId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al registrar entrada");
        return;
      }

      setSuccess(true);
      // Reset form
      setProductId("");
      setQuantity("");
      setSupplierId("");
      setLotNumber("");
      setExpiresAt("");
      setReason("");
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Entrada de Almacén</h2>
        <p className="text-sm text-gray-500">Registre ingresos de productos al inventario</p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
          ✅ Entrada registrada exitosamente. El inventario ha sido actualizado.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Datos de entrada</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Sede y Almacén */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Sede *</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={siteId}
                  onChange={(e) => { setSiteId(e.target.value); setWarehouseId(""); }}
                  required
                >
                  <option value="">Seleccionar sede</option>
                  {master.sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Almacén</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                >
                  <option value="">Sin almacén específico</option>
                  {filteredWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            {/* Origen */}
            <div className="space-y-1.5">
              <Label>Origen *</Label>
              <select
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              >
                {originOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Proveedor (conditional) */}
            {origin === "SUPPLIER" && (
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
            )}

            {/* Producto */}
            <div className="space-y-1.5">
              <Label>Producto *</Label>
              <select
                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              >
                <option value="">Seleccionar producto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                ))}
              </select>
            </div>

            {/* Cantidad y Unidad */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Cantidad *</Label>
                <Input
                  type="number"
                  min="0"
                  step={selectedProduct?.unit?.allowsDecimals ? "0.001" : "1"}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  required
                />
                {selectedProduct?.unit && (
                  <p className="text-xs text-gray-500">
                    {selectedProduct.unit.allowsDecimals ? `Permite decimales (${selectedProduct.unit.symbol})` : "Solo números enteros"}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Unidad *</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar</option>
                  {master.units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                </select>
              </div>
            </div>

            {/* Lote (conditional) */}
            {selectedProduct?.tracksLot && (
              <div className="space-y-1.5">
                <Label>Número de lote</Label>
                <Input
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="Ej: LOT-2026-001"
                />
              </div>
            )}

            {/* Vencimiento (conditional) */}
            {selectedProduct?.tracksExpiry && (
              <div className="space-y-1.5">
                <Label className="text-red-600">Fecha de vencimiento *</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  required={selectedProduct.tracksExpiry}
                />
              </div>
            )}

            {/* Observación */}
            <div className="space-y-1.5">
              <Label>Observación</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Notas adicionales sobre esta entrada..."
                rows={2}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Registrando..." : "Registrar entrada"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
