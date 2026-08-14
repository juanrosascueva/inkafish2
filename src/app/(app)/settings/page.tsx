"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, Package, Edit2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";

type Product = {
  id: string | number;
  code: string;
  name: string;
  active: boolean;
  tracksLot: boolean;
  tracksExpiry: boolean;
  presentation?: string | null;
  brand?: string | null;
  minStock?: number | null;
  imageUrl?: string | null;
  category: { id: string | number; name: string } | null;
  unit: { id: string | number; name: string; symbol: string; allowsDecimals: boolean } | null;
};

type Category = { id: string | number; name: string; code: string; active?: boolean };
type Unit = { id: string | number; name: string; symbol: string; allowsDecimals: boolean; active?: boolean };

export default function SettingsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Product Dialog state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "", categoryId: "", unitId: "", presentation: "", brand: "",
    tracksLot: false, tracksExpiry: false, allowsSubstitution: true, minStock: "", notes: "", imageUrl: ""
  });

  // Category Dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", code: "" });

  // Unit Dialog state
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitForm, setUnitForm] = useState({ name: "", symbol: "", allowsDecimals: false });

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

  // PRODUCT HANDLERS
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({ name: "", categoryId: "", unitId: "", presentation: "", brand: "", tracksLot: false, tracksExpiry: false, allowsSubstitution: true, minStock: "", notes: "", imageUrl: "" });
    setProductDialogOpen(true);
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name || "",
      categoryId: String(p.category?.id || ""),
      unitId: String(p.unit?.id || ""),
      presentation: p.presentation || "",
      brand: p.brand || "",
      tracksLot: p.tracksLot || false,
      tracksExpiry: p.tracksExpiry || false,
      allowsSubstitution: true,
      minStock: p.minStock !== undefined && p.minStock !== null ? String(p.minStock) : "",
      notes: "",
      imageUrl: p.imageUrl || "",
    });
    setProductDialogOpen(true);
  };

  const handleToggleProductActive = async (id: string | number) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.categoryId || !productForm.unitId) return;
    setSubmitting(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...productForm,
          minStock: productForm.minStock ? parseFloat(productForm.minStock) : 0,
        }),
      });
      if (res.ok) {
        setProductDialogOpen(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // CATEGORY HANDLERS
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: "", code: "" });
    setCategoryDialogOpen(true);
  };

  const handleOpenEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCategoryForm({ name: c.name, code: c.code });
    setCategoryDialogOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.code) return;
    setSubmitting(true);
    try {
      const method = editingCategory ? "PATCH" : "POST";
      const body = editingCategory ? { id: editingCategory.id, ...categoryForm } : categoryForm;

      const res = await fetch("/api/master?type=category", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setCategoryDialogOpen(false);
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // UNIT HANDLERS
  const handleOpenCreateUnit = () => {
    setEditingUnit(null);
    setUnitForm({ name: "", symbol: "", allowsDecimals: false });
    setUnitDialogOpen(true);
  };

  const handleOpenEditUnit = (u: Unit) => {
    setEditingUnit(u);
    setUnitForm({ name: u.name, symbol: u.symbol, allowsDecimals: u.allowsDecimals });
    setUnitDialogOpen(true);
  };

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.name || !unitForm.symbol) return;
    setSubmitting(true);
    try {
      const method = editingUnit ? "PATCH" : "POST";
      const body = editingUnit ? { id: editingUnit.id, ...unitForm } : unitForm;

      const res = await fetch("/api/master?type=unit", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setUnitDialogOpen(false);
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

        {/* PRODUCTS TAB */}
        <TabsContent value="products" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={handleOpenCreateProduct}>
              <Plus className="h-4 w-4" />Nuevo Producto
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl border animate-pulse" />)}</div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((p) => (
                <Card key={p.id} className={!p.active ? "opacity-60 bg-gray-50" : ""}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {p.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="h-6 w-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          {p.tracksExpiry && <span className="text-[11px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">Vencimiento</span>}
                          {p.tracksLot && <span className="text-[11px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Lote</span>}
                          {!p.active && <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">Inactivo</span>}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {p.code} · {p.category?.name || "Sin categoría"} · {p.unit?.name || "Unidad"} ({p.unit?.symbol || "UND"})
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditProduct(p)} className="h-8 px-2 text-xs">
                          <Edit2 className="h-3.5 w-3.5 mr-1" />Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleProductActive(p.id)} title={p.active ? "Desactivar" : "Activar"} className="h-8 px-2 text-xs text-gray-500 hover:text-gray-900">
                          <Power className={`h-3.5 w-3.5 ${p.active ? "text-red-500" : "text-green-500"}`} />
                        </Button>
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

        {/* CATEGORIES TAB */}
        <TabsContent value="categories" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleOpenCreateCategory}>
              <Plus className="h-4 w-4" />Nueva Categoría
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{c.code}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEditCategory(c)} className="h-8 px-2 text-xs">
                    <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* UNITS TAB */}
        <TabsContent value="units" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleOpenCreateUnit}>
              <Plus className="h-4 w-4" />Nueva Unidad
            </Button>
          </div>
          <div className="space-y-2">
            {units.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{u.name}</p>
                    <p className="text-xs text-gray-400">
                      Símbolo: <span className="font-mono">{u.symbol}</span> · {u.allowsDecimals ? "Permite decimales" : "Solo enteros"}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEditUnit(u)} className="h-8 px-2 text-xs">
                    <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Fotografía del producto (Cloudinary)</Label>
              <ImageUpload
                value={productForm.imageUrl}
                onChange={(url) => setProductForm({ ...productForm, imageUrl: url })}
                disabled={submitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nombre del Producto *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Ej: Lomo Fino de Res"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Categoría *</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Unidad *</Label>
                <select
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={productForm.unitId}
                  onChange={(e) => setProductForm({ ...productForm, unitId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Presentación</Label>
                <Input value={productForm.presentation} onChange={(e) => setProductForm({ ...productForm, presentation: e.target.value })} placeholder="Ej: 1 kg / Caja 12u" />
              </div>
              <div className="space-y-1.5">
                <Label>Marca</Label>
                <Input value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} placeholder="Ej: San Fernando" />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Stock mínimo</Label>
                <Input type="number" min="0" step="any" value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })} placeholder="0" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={productForm.tracksLot} onChange={(e) => setProductForm({ ...productForm, tracksLot: e.target.checked })} className="rounded" />
                Maneja lote
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={productForm.tracksExpiry} onChange={(e) => setProductForm({ ...productForm, tracksExpiry: e.target.checked })} className="rounded" />
                Maneja vencimiento
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={productForm.allowsSubstitution} onChange={(e) => setProductForm({ ...productForm, allowsSubstitution: e.target.checked })} className="rounded" />
                Permite sustitución
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : (editingProduct ? "Actualizar Producto" : "Guardar Producto")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre de la Categoría *</Label>
              <Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Ej: Proteínas" required />
            </div>
            <div className="space-y-1.5">
              <Label>Código *</Label>
              <Input value={categoryForm.code} onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase() })} placeholder="Ej: PRO" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : (editingCategory ? "Actualizar" : "Guardar")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingUnit ? "Editar Unidad" : "Nueva Unidad"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUnitSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre de la Unidad *</Label>
              <Input value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} placeholder="Ej: Kilogramo" required />
            </div>
            <div className="space-y-1.5">
              <Label>Símbolo *</Label>
              <Input value={unitForm.symbol} onChange={(e) => setUnitForm({ ...unitForm, symbol: e.target.value.toUpperCase() })} placeholder="Ej: KG" required />
            </div>
            <div className="pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={unitForm.allowsDecimals} onChange={(e) => setUnitForm({ ...unitForm, allowsDecimals: e.target.checked })} className="rounded" />
                Permite decimales
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUnitDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : (editingUnit ? "Actualizar" : "Guardar")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
