"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type Supplier = {
  id: number;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
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
          <p className="text-sm text-gray-500">{suppliers.length} registros</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
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
        <Card><CardContent className="py-12 text-center text-gray-400">No hay proveedores</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    {s.documentNumber && <p className="text-xs text-gray-500">RUC: {s.documentNumber}</p>}
                    {s.contactName && <p className="text-xs text-gray-500">Contacto: {s.contactName}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      {s.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3" />{s.phone}
                        </span>
                      )}
                      {s.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="h-3 w-3" />{s.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {s.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Proveedor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>RUC / Documento</Label>
                <Input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Contacto</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
