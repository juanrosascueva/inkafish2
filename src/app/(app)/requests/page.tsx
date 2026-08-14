"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonList } from "@/components/ui/skeleton-card";
import { cn, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";

type Request = {
  id: number;
  requestNumber: string;
  status: string;
  priority: string;
  type: string;
  outOfSchedule: boolean;
  requiredDate: string;
  notes: string;
  createdAt: string;
  site: { id: number; name: string } | null;
  area: { id: number; name: string } | null;
  requestedByUser: { id: number; name: string } | null;
};

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "DRAFT", label: "Borrador" },
  { value: "PENDING_APPROVAL", label: "Pendiente" },
  { value: "APPROVED", label: "Aprobada" },
  { value: "REJECTED", label: "Rechazada" },
  { value: "IN_PREPARATION", label: "En preparación" },
  { value: "DISPATCHED", label: "Despachada" },
  { value: "RECEIVED", label: "Recibida" },
];

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/requests?${params}`)
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = requests.filter(
    (r) =>
      r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
      (r.area?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Solicitudes</h2>
          <p className="text-sm text-gray-500">{filtered.length} registros</p>
        </div>
        <Link href="/requests/new">
          <Button>
            <Plus className="h-4 w-4" />
            Nueva Solicitud
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por número o área..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <SkeletonList count={4} />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-400">No se encontraron solicitudes</p>
            <Link href="/requests/new" className="mt-3 inline-block">
              <Button variant="outline" size="sm">Crear primera solicitud</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((req) => (
            <Link key={req.id} href={`/requests/${req.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{req.requestNumber}</p>
                        {req.priority === "URGENT" && (
                          <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                            🚨 Urgente
                          </span>
                        )}
                        {req.outOfSchedule && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                            Fuera de horario
                          </span>
                        )}
                        {req.type === "EXTRAORDINARY" && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                            Extraordinaria
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {req.area?.name} · {req.site?.name} · {req.requestedByUser?.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Requerida: {formatDate(req.requiredDate)} · Creada: {formatDate(req.createdAt)}
                      </p>
                    </div>
                    <span className={cn("text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap", getStatusColor(req.status))}>
                      {getStatusLabel(req.status)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
