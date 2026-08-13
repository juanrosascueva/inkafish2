"use client";
import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Package,
  Clock,
  AlertTriangle,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, getStatusColor, getStatusLabel, formatDate, formatDateTime, canApproveRequests } from "@/lib/utils";

type RequestDetail = {
  id: number;
  requestNumber: string;
  status: string;
  priority: string;
  type: string;
  outOfSchedule: boolean;
  requiredDate: string;
  shift: string | null;
  notes: string | null;
  urgentReason: string | null;
  closedReason: string | null;
  closedAt: string | null;
  createdAt: string;
  site: { id: number; name: string } | null;
  area: { id: number; name: string } | null;
  requestedByUser: { id: number; name: string } | null;
};

type RequestItem = {
  id: number;
  requestedQuantity: string;
  approvedQuantity: string | null;
  fulfilledQuantity: string | null;
  itemStatus: string;
  approvalComment: string | null;
  productNameTemp: string | null;
  notes: string | null;
  product: { id: number; name: string; code: string } | null;
  unit: { id: number; name: string; symbol: string } | null;
};

type Approval = {
  id: number;
  action: string;
  originalQuantity: string | null;
  approvedQuantity: string | null;
  reason: string | null;
  createdAt: string;
  approvedByUser: { id: number; name: string } | null;
};

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ role: string; id: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Approval state
  const [approvalMode, setApprovalMode] = useState(false);
  const [itemApprovals, setItemApprovals] = useState<
    { id: number; approved: boolean; approvedQuantity: string; reason: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setCurrentUser(d.user));
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    const res = await fetch(`/api/requests/${id}`);
    if (res.ok) {
      const d = await res.json();
      setRequest(d.request);
      setItems(d.items ?? []);
      setApprovals(d.approvals ?? []);
    }
    setLoading(false);
  };

  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      await fetchRequest();
    } finally {
      setSubmitting(false);
    }
  };

  const startApproval = () => {
    setItemApprovals(
      items.map((i) => ({
        id: i.id,
        approved: true,
        approvedQuantity: i.requestedQuantity,
        reason: "",
      }))
    );
    setApprovalMode(true);
  };

  const submitApproval = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          items: itemApprovals.map((ia) => ({
            id: ia.id,
            approved: ia.approved,
            originalQuantity: items.find((i) => i.id === ia.id)?.requestedQuantity,
            approvedQuantity: parseFloat(ia.approvedQuantity),
            reason: ia.reason || undefined,
          })),
        }),
      });
      setApprovalMode(false);
      await fetchRequest();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Solicitud no encontrada</p>
        <Link href="/requests"><Button className="mt-3" variant="outline">Volver</Button></Link>
      </div>
    );
  }

  const canApprove = currentUser && canApproveRequests(currentUser.role) && request.status === "PENDING_APPROVAL";
  const canDispatch = currentUser && ["ALMACEN", "ADMINISTRACION", "GERENCIA"].includes(currentUser.role) &&
    ["APPROVED", "PARTIALLY_APPROVED", "IN_PREPARATION"].includes(request.status);
  const canReceive = ["DISPATCHED", "PARTIALLY_DISPATCHED"].includes(request.status);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{request.requestNumber}</h2>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStatusColor(request.status))}>
              {getStatusLabel(request.status)}
            </span>
            {request.priority === "URGENT" && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                🚨 Urgente
              </span>
            )}
            {request.type === "EXTRAORDINARY" && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                Extraordinaria
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">Sede</p>
            <p className="font-medium">{request.site?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Área</p>
            <p className="font-medium">{request.area?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Solicitado por</p>
            <p className="font-medium">{request.requestedByUser?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Fecha requerida</p>
            <p className="font-medium">{formatDate(request.requiredDate)}</p>
          </div>
          {request.shift && (
            <div>
              <p className="text-gray-500 text-xs">Turno</p>
              <p className="font-medium">{request.shift}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500 text-xs">Creada</p>
            <p className="font-medium">{formatDateTime(request.createdAt)}</p>
          </div>
          {request.urgentReason && (
            <div className="col-span-2">
              <p className="text-red-600 text-xs font-medium">Motivo urgente</p>
              <p className="text-red-700 bg-red-50 p-2 rounded-lg text-sm mt-1">{request.urgentReason}</p>
            </div>
          )}
          {request.notes && (
            <div className="col-span-2">
              <p className="text-gray-500 text-xs">Notas</p>
              <p className="text-gray-700">{request.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ítems ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id} className="p-3 border border-gray-200 rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.product?.name ?? item.productNameTemp ?? `Ítem ${idx + 1}`}
                  </p>
                  {item.product && (
                    <p className="text-xs text-gray-400">{item.product.code}</p>
                  )}
                </div>
                <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", getStatusColor(item.itemStatus))}>
                  {getStatusLabel(item.itemStatus)}
                </span>
              </div>

              {approvalMode ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={itemApprovals.find((ia) => ia.id === item.id)?.approved ?? true}
                        onChange={(e) =>
                          setItemApprovals((prev) =>
                            prev.map((ia) => ia.id === item.id ? { ...ia, approved: e.target.checked } : ia)
                          )
                        }
                      />
                      Aprobar
                    </label>
                    <Input
                      type="number"
                      className="w-24 h-8 text-sm"
                      value={itemApprovals.find((ia) => ia.id === item.id)?.approvedQuantity ?? ""}
                      onChange={(e) =>
                        setItemApprovals((prev) =>
                          prev.map((ia) => ia.id === item.id ? { ...ia, approvedQuantity: e.target.value } : ia)
                        )
                      }
                      placeholder="Cant."
                    />
                    <span className="text-xs text-gray-500">/ {item.requestedQuantity} {item.unit?.symbol}</span>
                  </div>
                  <Input
                    className="h-8 text-xs"
                    placeholder="Comentario (requerido si modifica/rechaza)"
                    value={itemApprovals.find((ia) => ia.id === item.id)?.reason ?? ""}
                    onChange={(e) =>
                      setItemApprovals((prev) =>
                        prev.map((ia) => ia.id === item.id ? { ...ia, reason: e.target.value } : ia)
                      )
                    }
                  />
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                  <span>Solicitado: <strong>{item.requestedQuantity} {item.unit?.symbol}</strong></span>
                  {item.approvedQuantity && (
                    <span>Aprobado: <strong className="text-green-600">{item.approvedQuantity} {item.unit?.symbol}</strong></span>
                  )}
                  {item.fulfilledQuantity && parseFloat(item.fulfilledQuantity) > 0 && (
                    <span>Entregado: <strong className="text-blue-600">{item.fulfilledQuantity} {item.unit?.symbol}</strong></span>
                  )}
                </div>
              )}

              {item.approvalComment && !approvalMode && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                  💬 {item.approvalComment}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Approval history */}
      {approvals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historial de aprobaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {approvals.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-2 text-sm">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  a.action === "APPROVE" ? "bg-green-100" : "bg-red-100"
                )}>
                  {a.action === "APPROVE" ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {a.action === "APPROVE" ? "Aprobado" : "Rechazado"} por {a.approvedByUser?.name}
                  </p>
                  {a.reason && <p className="text-xs text-gray-500">Motivo: {a.reason}</p>}
                  <p className="text-xs text-gray-400">{formatDateTime(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {request.status === "DRAFT" && (
          <Button onClick={() => handleAction("submit")} disabled={submitting} className="w-full">
            <Package className="h-4 w-4" />
            Enviar para aprobación
          </Button>
        )}

        {canApprove && !approvalMode && (
          <Button onClick={startApproval} variant="success" className="w-full">
            <CheckCircle className="h-4 w-4" />
            Iniciar aprobación por ítem
          </Button>
        )}

        {approvalMode && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setApprovalMode(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={submitApproval} disabled={submitting} variant="success" className="flex-1">
              Confirmar aprobación
            </Button>
          </div>
        )}

        {canDispatch && (
          <Button onClick={() => handleAction("dispatch")} disabled={submitting} variant="default" className="w-full">
            <Truck className="h-4 w-4" />
            Registrar despacho
          </Button>
        )}

        {canReceive && (
          <Button onClick={() => handleAction("receive")} disabled={submitting} variant="success" className="w-full">
            <CheckCircle className="h-4 w-4" />
            Confirmar recepción
          </Button>
        )}

        {["PARTIALLY_RECEIVED", "PARTIALLY_DISPATCHED"].includes(request.status) && (
          <Button
            onClick={() => {
              const reason = prompt("Motivo de cierre incompleto:");
              if (reason) handleAction("close_incomplete", { closedReason: reason });
            }}
            variant="outline"
            className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
            disabled={submitting}
          >
            <Clock className="h-4 w-4" />
            Cerrar incompleto
          </Button>
        )}
      </div>
    </div>
  );
}
