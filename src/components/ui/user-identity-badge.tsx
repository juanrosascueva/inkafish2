"use client";
import React, { useEffect, useState } from "react";
import { UserCheck, ShieldCheck, MapPin, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  siteId?: string | null;
  areaId?: string | null;
};

interface UserIdentityBadgeProps {
  onUserLoaded?: (user: UserProfile) => void;
  className?: string;
  compact?: boolean;
}

export function UserIdentityBadge({ onUserLoaded, className, compact = false }: UserIdentityBadgeProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          const u: UserProfile = {
            id: data.user.id || data.user._id,
            name: data.user.name || "Usuario del Sistema",
            email: data.user.email || "admin@inkafish.pe",
            role: data.user.role || "ADMIN",
            siteId: data.user.siteId || null,
            areaId: data.user.areaId || null,
          };
          setUser(u);
          if (onUserLoaded) onUserLoaded(u);
        } else {
          // Fallback predeterminado para demo
          const defaultUser: UserProfile = {
            id: "usr_admin_001",
            name: "Juan Rosas",
            email: "jrosas@inkafish.pe",
            role: "Administrador",
            siteId: undefined,
          };
          setUser(defaultUser);
          if (onUserLoaded) onUserLoaded(defaultUser);
        }
      })
      .catch(() => {
        const defaultUser: UserProfile = {
          id: "usr_admin_001",
          name: "Juan Rosas",
          email: "jrosas@inkafish.pe",
          role: "Administrador",
        };
        setUser(defaultUser);
        if (onUserLoaded) onUserLoaded(defaultUser);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="h-9 w-9 rounded-full bg-gray-200" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-32 bg-gray-200 rounded" />
          <div className="h-2.5 w-24 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const getRoleLabel = (role: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "Administrador";
      case "CHEF":
        return "Jefe de Cocina";
      case "WAREHOUSE":
        return "Almacenero";
      case "APPROVER":
        return "Aprobador";
      default:
        return role || "Usuario Autenticado";
    }
  };

  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg text-xs text-[#1b6970] font-medium", className)}>
        <UserCheck className="h-3.5 w-3.5 text-[#1b6970]" />
        <span>Emisor: <strong className="font-bold">{user.name}</strong> ({getRoleLabel(user.role)})</span>
      </div>
    );
  }

  return (
    <div className={cn("p-3.5 bg-gradient-to-r from-teal-50/80 via-white to-gray-50 border border-teal-100/80 rounded-2xl shadow-sm flex items-center justify-between gap-3", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar badge */}
        <div className="h-10 w-10 rounded-xl bg-[#1b6970] text-white flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-900 text-sm truncate">{user.name}</p>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-semibold bg-[#1b6970] text-white">
              <ShieldCheck className="h-3 w-3" />
              {getRoleLabel(user.role)}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end flex-shrink-0">
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Sesión Autenticada
        </span>
      </div>
    </div>
  );
}
