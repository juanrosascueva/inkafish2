"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InkaFishLogo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al iniciar sesión");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const demoUsers = [
    { email: "gerencia@sistema.com", role: "Gerencia", password: "admin123" },
    { email: "admin@sistema.com", role: "Administración", password: "admin123" },
    { email: "almacen@sistema.com", role: "Almacén", password: "admin123" },
    { email: "chef@sistema.com", role: "Chef Ejecutiva", password: "admin123" },
    { email: "solicitante@sistema.com", role: "Solicitante", password: "admin123" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#112E32] via-[#163C41] to-[#347B85] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative subtle brand background blur circles */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[#E6007E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-[#F5921E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo Header */}
        <div className="text-center bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 shadow-xl">
          <InkaFishLogo variant="full" lightMode={true} className="mx-auto" />
          <p className="text-teal-100/90 text-xs mt-3 font-medium uppercase tracking-wider">
            Sistema de Gestión Integral
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-teal-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            Iniciar sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-gray-700 font-medium">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@inkafish.com"
                required
                autoComplete="email"
                className="focus-visible:ring-[#347B85]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-gray-700 font-medium">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-10 focus-visible:ring-[#347B85]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-11 text-base font-semibold shadow-md">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Ingresando...
                </span>
              ) : (
                "Ingresar al sistema"
              )}
            </Button>
          </form>

          {/* Demo users */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-3">Usuarios de demostración (clave: admin123)</p>
            <div className="space-y-1.5">
              {demoUsers.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => { setEmail(u.email); setPassword(u.password); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-teal-50 hover:text-teal-800 rounded-lg transition-colors text-left border border-transparent hover:border-teal-200"
                >
                  <span className="font-semibold text-teal-900">{u.role}</span>
                  <span className="text-gray-400">{u.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-teal-100/80 text-xs">
          Inka Fish Ops · Solicitudes · Inventario · Producción v1.0
        </p>
      </div>
    </div>
  );
}
