"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, getStatusColor, getStatusLabel, formatDate } from "@/lib/utils";

type Request = {
  id: number;
  requestNumber: string;
  status: string;
  priority: string;
  type: string;
  requiredDate: string;
  createdAt: string;
  urgentReason: string | null;
  site: { id: number; name: string } | null;
  area: { id: number; name: string } | null;
  requestedByUser: { id: number; name: string } | null;
};

export default function ApprovalsPage() {
  const [pending, setPending] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/requests?status=PENDING_APPROVAL")
      .then((r) => r.json())
      .then((d) => setPending(d.requests ?? []))
      .finally(() => setLoading(false));
  }, []);

  const urgentCount = pending.filter((r) => r.priority === "URGENT").length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Bandeja de Aprobaciones</h2>
        <p className="text-sm text-gray-500">
          {pending.length} solicitudes pendientes · {urgentCount} urgentes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">Pendientes</p>
          </div>
          <p className="text-2xl font-bold text-yellow-900 mt-1">{pending.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800">Urgentes</p>
          </div>
          <p className="text-2xl font-bold text-red-900 mt-1">{urgentCount}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">Hoy</p>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {pending.filter((r) => {
              const today = new Date().toISOString().split("T")[0];
              return r.createdAt?.startsWith(today);
            }).length}
          </p>
        </div>
      </div>

      {/* Requests sorted by urgency */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No hay solicitudes pendientes</p>
            <p className="text-gray-400 text-sm mt-1">¡Excelente! Todo está al día.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {[...pending]
            .sort((a, b) => {
              if (a.priority === "URGENT" && b.priority !== "URGENT") return -1;
              if (b.priority === "URGENT" && a.priority !== "URGENT") return 1;
              return new Date(a.requiredDate).getTime() - new Date(b.requiredDate).getTime();
            })
            .map((req) => (
              <Link key={req.id} href={`/requests/${req.id}`}>
                <Card className={cn(
                  "hover:shadow-md transition-shadow cursor-pointer",
                  req.priority === "URGENT" && "border-red-200 bg-red-50/30"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{req.requestNumber}</p>
                          {req.priority === "URGENT" && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium animate-pulse">
                              🚨 URGENTE
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {req.area?.name} · {req.site?.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Por: {req.requestedByUser?.name} · Requerida: {formatDate(req.requiredDate)}
                        </p>
                        {req.urgentReason && (
                          <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded">
                            📌 {req.urgentReason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStatusColor(req.status))}>
                          {getStatusLabel(req.status)}
                        </span>
                        <span className="text-xs text-blue-600 font-medium">Aprobar →</span>
                      </div>
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
