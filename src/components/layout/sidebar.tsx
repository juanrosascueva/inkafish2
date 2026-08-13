"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { InkaFishLogo } from "@/components/ui/logo";
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  Package,
  ArrowLeftRight,
  ShoppingCart,
  Factory,
  Trash2,
  BarChart3,
  Settings,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Menu,
  X,
  Boxes,
  Truck,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Solicitudes", icon: ClipboardList },
  { href: "/approvals", label: "Aprobaciones", icon: CheckSquare },
  { href: "/inventory", label: "Inventario", icon: Boxes },
  { href: "/warehouse", label: "Almacén", icon: Package },
  { href: "/transfers", label: "Transferencias", icon: ArrowLeftRight },
  { href: "/purchases", label: "Compras", icon: ShoppingCart },
  { href: "/suppliers", label: "Proveedores", icon: Truck },
  { href: "/production", label: "Producción", icon: Factory },
  { href: "/waste", label: "Mermas", icon: Trash2 },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
];

type SidebarProps = {
  user: { name: string; role: string; email: string };
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[#163C41]">
      {/* Logo */}
      <div className={cn("flex items-center px-4 py-4 border-b border-[#245B63]", collapsed ? "justify-center px-2" : "justify-start gap-3")}>
        {collapsed ? (
          <InkaFishLogo variant="icon" className="w-8 h-8" />
        ) : (
          <InkaFishLogo variant="horizontal" lightMode={true} />
        )}
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-[#245B63] bg-[#123136]/50">
          <p className="text-white text-sm font-semibold truncate">{user.name}</p>
          <p className="text-teal-200 text-xs truncate capitalize">{user.role.replace(/_/g, " ")}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[#347B85] text-white shadow-sm font-semibold"
                  : "text-teal-100/90 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-white" : "text-teal-200")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#245B63] p-2 space-y-1">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-100/80 hover:bg-red-500/20 hover:text-red-200 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0 text-teal-200" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-teal-200 hover:bg-white/10 transition-colors",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Contraer</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#347B85] text-white shadow-lg hover:bg-[#296870]"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed left-0 top-0 z-40 h-full w-64 bg-[#163C41] transition-transform duration-300 shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-full bg-[#163C41] transition-all duration-300 border-r border-[#245B63]",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
