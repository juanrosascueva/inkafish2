import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy", { locale: es });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "PEN"
): string {
  if (amount === null || amount === undefined) return "-";
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatQuantity(
  quantity: number | string | null | undefined,
  allowsDecimals = true,
  precision = 3
): string {
  if (quantity === null || quantity === undefined) return "0";
  const n = typeof quantity === "string" ? parseFloat(quantity) : quantity;
  if (!allowsDecimals) return Math.round(n).toString();
  return n.toFixed(precision).replace(/\.?0+$/, "");
}

export function generateCode(prefix: string, id: number): string {
  return `${prefix}-${String(id).padStart(6, "0")}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
    PARTIALLY_APPROVED: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    IN_PREPARATION: "bg-purple-100 text-purple-800",
    PARTIALLY_DISPATCHED: "bg-orange-100 text-orange-800",
    DISPATCHED: "bg-indigo-100 text-indigo-800",
    PARTIALLY_RECEIVED: "bg-cyan-100 text-cyan-800",
    RECEIVED: "bg-emerald-100 text-emerald-800",
    OBSERVED: "bg-amber-100 text-amber-800",
    CLOSED_INCOMPLETE: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-red-100 text-red-700",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    PLANNED: "bg-indigo-100 text-indigo-800",
    IN_TRANSIT: "bg-orange-100 text-orange-800",
    ORDERED: "bg-purple-100 text-purple-800",
    COMPLIANT: "bg-green-100 text-green-800",
    NORMAL: "bg-gray-100 text-gray-700",
    URGENT: "bg-red-100 text-red-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-700";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Borrador",
    PENDING_APPROVAL: "Pendiente de aprobación",
    PARTIALLY_APPROVED: "Parcialmente aprobada",
    APPROVED: "Aprobada",
    REJECTED: "Rechazada",
    IN_PREPARATION: "En preparación",
    PARTIALLY_DISPATCHED: "Parcialmente despachada",
    DISPATCHED: "Despachada",
    PARTIALLY_RECEIVED: "Parcialmente recibida",
    RECEIVED: "Recibida",
    OBSERVED: "Observada",
    CLOSED_INCOMPLETE: "Cerrada incompleta",
    CANCELLED: "Cancelada",
    IN_PROGRESS: "En progreso",
    COMPLETED: "Completada",
    PLANNED: "Planificada",
    IN_TRANSIT: "En tránsito",
    ORDERED: "Ordenada",
    COMPLIANT: "Conforme",
    NORMAL: "Normal",
    URGENT: "Urgente",
    REGULAR: "Regular",
    EXTRAORDINARY: "Extraordinaria",
    STORAGE: "Almacenamiento",
    PRODUCTION: "Producción",
    PREPARATION: "Preparación",
    SERVICE: "Servicio",
    RETURN: "Devolución",
    OTHER: "Otro",
    GERENCIA: "Gerencia",
    ADMINISTRACION: "Administración",
    CHEF_EJECUTIVA: "Chef Ejecutiva",
    JEFE_COCINA: "Jefe de Cocina",
    JEFE_SALON: "Jefe de Salón",
    JEFE_BAR: "Jefe de Bar",
    ALMACEN: "Almacén",
    PRODUCCION: "Producción",
    RESPONSABLE_AREA: "Responsable de Área",
    SOLICITANTE: "Solicitante",
  };
  return labels[status] ?? status;
}

export function canViewCosts(role: string): boolean {
  return ["GERENCIA", "ADMINISTRACION", "CHEF_EJECUTIVA", "ALMACEN"].includes(role);
}

export function canApproveRequests(role: string): boolean {
  return [
    "GERENCIA",
    "ADMINISTRACION",
    "CHEF_EJECUTIVA",
    "JEFE_COCINA",
    "JEFE_SALON",
    "JEFE_BAR",
  ].includes(role);
}

export function canManageInventory(role: string): boolean {
  return ["GERENCIA", "ADMINISTRACION", "ALMACEN"].includes(role);
}

export function canManageMaster(role: string): boolean {
  return ["GERENCIA", "ADMINISTRACION"].includes(role);
}
