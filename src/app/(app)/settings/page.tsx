"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Product = {
  id: number;
  code: string;
  name: string;
  active: boolean;
  tracksLot: boolean;
  tracksExpiry: boolean;
  category: { id: number; name: string } | null;
  unit: { id: number; name: string; symbol: string; allowsDecimals: boolean } | null;
};

type Category = { id: number; name: string; code: string };
type Unit = { id: number; name: string; symbol: string; allowsDecimals: boolean; active: boolean };

export default function SettingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", categoryId: "", unitId: "", presentation: "", brand: "",
    tracksLot: false, tracksExpiry: false, allowsSubstitution: true, minStock: "", notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/master?type=categories").then((r) => r.json()),
      fetch("/api/master?type=units").then((r) => r.json()),
    ]).then(([prodData, catData, unitData]) => {
      setProducts(prodData.products ?? []);
      setCategories(catData.categories ?? []);
      setUnits(unitData.units ?? []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.categoryId || !form.unitId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          minStock: form.minStock ? parseFloat(form.minStock) : undefined,
        }),
      });
      if (res.ok) {
        setProductDialogOpen(false);
        setForm({ name: "", categoryId: "", unitId: "", presentation: "", brand: "", tracksLot: false, tracksExpiry: false, allowsSubstitution: true, minStock: "", notes: "" });
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
        <p className="text-sm text-gray-500">Catálogos maestros del sistema</p>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="units">Unidades</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={() => setProductDialogOpen(true)}>
              <Plus className="h-4 w-4" />Nuevo
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl border animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((p) => (
                <Card key={p.id} className={!p.active ? "opacity-60" : ""}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          {p.tracksExpiry && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Vencimiento</span>}
                          {p.tracksLot && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Lote</span>}
                          {!p.active && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Inactivo</span>}
                        </div>
                        <p className="text-xs text-gray-400">{p.code} · {p.category?.name} · {p.unit?.name} ({p.unit?.symbol})</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredProducts.length === 0 && (
                <Card><CardContent className="py-8 text-center text-gray-400 text-sm">No se encontraron productos</CardContent></Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3">
                  <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{c.code}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="units" className="mt-4">
          <div className="space-y-2">
            {units.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                      <p className="text-xs text-gray-400">
                        Símbolo: {u.symbol} · {u.allowsDecimals ? "Permite decimales" : "Solo enteros"}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Product dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Producto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Categoría *</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
                  <option value="">Seleccionar</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Unidad *</Label>
                <select className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })} required>
                  <option value="">Seleccionar</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Presentación</Label>
                <Input value={form.presentation} onChange={(e) => setForm({ ...form, presentation: e.target.value })} placeholder="Ej: 1 kg" />
              </div>
              <div className="space-y-1.5">
                <Label>Marca</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Stock mínimo</Label>
                <Input type="number" min="0" step="any" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.tracksLot} onChange={(e) => setForm({ ...form, tracksLot: e.target.checked })} className="rounded" />
                Maneja lote
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.tracksExpiry} onChange={(e) => setForm({ ...form, tracksExpiry: e.target.checked })} className="rounded" />
                Maneja vencimiento
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.allowsSubstitution} onChange={(e) => setForm({ ...form, allowsSubstitution: e.target.checked })} className="rounded" />
                Permite sustitución
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
