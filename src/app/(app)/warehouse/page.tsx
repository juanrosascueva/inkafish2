"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CustomSelect } from "@/components/ui/custom-select";

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
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
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

  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: p.name,
    code: p.code,
    sublabel: p.unit?.symbol || "UND",
  }));

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

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle className="text-base">Datos de entrada</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Sede y Almacén */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Sede *</Label>
                  <CustomSelect
                    options={master.sites.map((s) => ({ value: String(s.id), label: s.name }))}
                    value={siteId}
                    onChange={(val) => { setSiteId(val); setWarehouseId(""); }}
                    placeholder="Seleccionar sede"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Almacén</Label>
                  <CustomSelect
                    options={filteredWarehouses.map((w) => ({ value: String(w.id), label: w.name }))}
                    value={warehouseId}
                    onChange={setWarehouseId}
                    placeholder="Sin almacén específico"
                  />
                </div>
              </div>

              {/* Origen */}
              <div className="space-y-1.5">
                <Label>Origen *</Label>
                <CustomSelect
                  options={originOptions}
                  value={origin}
                  onChange={setOrigin}
                />
              </div>

              {/* Proveedor (conditional) */}
              {origin === "SUPPLIER" && (
                <div className="space-y-1.5">
                  <Label>Proveedor *</Label>
                  <CustomSelect
                    options={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
                    value={supplierId}
                    onChange={setSupplierId}
                    placeholder="Seleccionar proveedor"
                  />
                </div>
              )}

              {/* Producto */}
              <div className="space-y-1.5">
                <Label>Producto / Insumo *</Label>
                <SearchableSelect
                  options={productOptions}
                  value={productId}
                  onChange={setProductId}
                  placeholder="Buscar o seleccionar producto..."
                  searchPlaceholder="Escribe el nombre o código..."
                />
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
                  <CustomSelect
                    options={master.units.map((u) => ({ value: String(u.id), label: `${u.name} (${u.symbol})` }))}
                    value={unitId}
                    onChange={setUnitId}
                    placeholder="Seleccionar unidad"
                  />
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
      )}
    </div>
  );
}
