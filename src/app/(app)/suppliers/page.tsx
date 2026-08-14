"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, Phone, Mail, Edit2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Supplier = {
  id: string | number;
  name: string;
  documentNumber: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  notes: string | null;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", documentNumber: "", contactName: "", phone: "", email: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = () => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const filtered = suppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.documentNumber ?? "").includes(search)
  );

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setForm({ name: "", documentNumber: "", contactName: "", phone: "", email: "", notes: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setForm({
      name: s.name || "",
      documentNumber: s.documentNumber || "",
      contactName: s.contactName || "",
      phone: s.phone || "",
      email: s.email || "",
      notes: s.notes || "",
    });
    setDialogOpen(true);
  };

  const handleToggleActive = async (id: string | number) => {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (res.ok) fetchSuppliers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : "/api/suppliers";
      const method = editingSupplier ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setDialogOpen(false);
        setForm({ name: "", documentNumber: "", contactName: "", phone: "", email: "", notes: "" });
        fetchSuppliers();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Proveedores</h2>
          <p className="text-sm text-gray-500">{suppliers.length} registros en el sistema</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" />Nuevo Proveedor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Buscar por nombre o RUC..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-gray-400">No hay proveedores registrados</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <Card key={s.id} className={!s.active ? "opacity-60 bg-gray-50" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                        {s.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {s.documentNumber && <p className="text-xs text-gray-500 mt-0.5">RUC / Doc: {s.documentNumber}</p>}
                    {s.contactName && <p className="text-xs text-gray-500">Contacto: {s.contactName}</p>}
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {s.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3 text-gray-400" />{s.phone}
                        </span>
                      )}
                      {s.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="h-3 w-3 text-gray-400" />{s.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(s)} className="h-8 px-2 text-xs">
                      <Edit2 className="h-3.5 w-3.5 mr-1" />Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(s.id)} title={s.active ? "Desactivar" : "Activar"} className="h-8 px-2 text-xs text-gray-500 hover:text-gray-900">
                      <Power className={`h-3.5 w-3.5 ${s.active ? "text-red-500" : "text-green-500"}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Supplier Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre / Razón Social *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Proveedora Central SAC" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>RUC / Documento</Label>
                <Input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} placeholder="20123456789" />
              </div>
              <div className="space-y-1.5">
                <Label>Nombre de Contacto</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Carlos Pérez" />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="999888777" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contacto@empresa.com" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : (editingSupplier ? "Actualizar" : "Guardar")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
