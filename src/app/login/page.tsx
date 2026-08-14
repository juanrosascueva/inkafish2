"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showDemo, setShowDemo] = useState(false);

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
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col lg:flex-row font-sans">
      {/* TABLET HEADER (visible on medium screens only: md:flex lg:hidden) */}
      <header className="hidden md:flex lg:hidden w-full bg-[#071524] py-4 px-6 border-b-2 border-[#E6007E] justify-center items-center shadow-md">
        <InkaFishLogo variant="horizontal" lightMode={true} tagline="Orgullo de comer como en casa" />
      </header>

      {/* DESKTOP LEFT PANEL (visible on large screens only: lg:flex) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-[460px] bg-[#071524] relative overflow-hidden flex-col justify-between p-12 text-white shadow-2xl shrink-0">
        {/* Background Fish Scale & Ocean Wave SVG Graphic */}
        <svg
          className="absolute inset-0 w-full h-full opacity-25 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="fish-scale" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 0 20 Q 20 0 40 20 Q 20 40 0 20 Z"
                fill="none"
                stroke="#347B85"
                strokeWidth="1"
              />
              <path
                d="M 20 0 Q 40 20 20 40"
                fill="none"
                stroke="#347B85"
                strokeWidth="0.75"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fish-scale)" />
          {/* Waves at bottom */}
          <path d="M -100 700 Q 100 650 300 720 T 700 680" fill="none" stroke="#00A8B5" strokeWidth="2" opacity="0.6" />
          <path d="M -100 720 Q 150 780 400 700 T 800 750" fill="none" stroke="#E6007E" strokeWidth="2" opacity="0.5" />
          <path d="M -100 750 Q 200 710 450 770 T 900 730" fill="none" stroke="#F5921E" strokeWidth="1.5" opacity="0.5" />
        </svg>

        {/* Top Spacer */}
        <div className="z-10" />

        {/* Center Content */}
        <div className="z-10 flex flex-col items-center text-center my-auto">
          <InkaFishLogo variant="full" lightMode={true} tagline="Orgullo de comer como en casa" className="scale-110" />
          
          <div className="w-16 h-px bg-white/20 my-8" />

          {/* Small Golden Fish Icon */}
          <div className="mb-4">
            <svg viewBox="0 0 140 100" className="w-8 h-8 mx-auto" fill="none">
              <path d="M 38 20 L 15 28 L 38 48 Z" fill="#F5921E" />
              <path d="M 38 52 L 15 72 L 38 80 Z" fill="#F5921E" />
              <polygon points="38,32 48,32 48,68 38,68" fill="#F5921E" />
              <path d="M 68 12 L 85 24 L 72 24 Z" fill="#F5921E" />
              <path d="M 68 88 L 85 76 L 72 76 Z" fill="#F5921E" />
              <rect x="48" y="24" width="24" height="12" fill="#F5921E" />
              <rect x="72" y="24" width="16" height="12" fill="#F5921E" />
              <rect x="48" y="36" width="12" height="12" fill="#F5921E" />
              <rect x="48" y="52" width="12" height="12" fill="#F5921E" />
              <rect x="48" y="64" width="24" height="12" fill="#F5921E" />
              <rect x="72" y="64" width="16" height="12" fill="#F5921E" />
              <rect x="72" y="36" width="12" height="12" fill="#F5921E" />
              <rect x="72" y="52" width="12" height="12" fill="#F5921E" />
              <rect x="60" y="36" width="12" height="12" fill="#F5921E" />
              <rect x="60" y="52" width="12" height="12" fill="#F5921E" />
              <rect x="54" y="44" width="12" height="12" fill="#F5921E" stroke="#FFFFFF" strokeWidth="1.5" />
              <rect x="66" y="44" width="12" height="12" fill="#F5921E" stroke="#FFFFFF" strokeWidth="1.5" />
              <rect x="60" y="44" width="12" height="12" fill="#F5921E" />
              <path d="M 84 32 H 102 L 115 50 L 102 68 H 84 V 56 H 88 V 44 H 84 Z" fill="#F5921E" />
              <circle cx="100" cy="44" r="3.5" fill="#FFFFFF" />
            </svg>
          </div>

          <p className="text-sm font-medium text-teal-100/90 max-w-xs leading-relaxed tracking-wide">
            Gestión simple para una operación precisa
          </p>
        </div>

        {/* Bottom Spacer */}
        <div className="z-10 text-xs text-white/40 text-center">
          Inka Fish © {new Date().getFullYear()}
        </div>
      </div>

      {/* RIGHT / MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 min-h-[calc(100vh-80px)] md:min-h-screen">
        {/* MOBILE LOGO HEADER (visible on small screens only: md:hidden) */}
        <div className="md:hidden mb-6 text-center">
          <InkaFishLogo variant="full" lightMode={false} tagline="Orgullo de comer como en casa" />
        </div>

        {/* LOGIN CARD CONTAINER */}
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bienvenido</h1>
            <p className="text-sm text-gray-500 mt-1">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-gray-700 block">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@inkafish.com"
                  required
                  autoComplete="email"
                  className="pl-10 h-11 text-sm border-gray-200 focus-visible:ring-1 focus-visible:ring-[#347B85] rounded-xl bg-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-gray-700 block">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pl-10 pr-10 h-11 text-sm border-gray-200 focus-visible:ring-1 focus-visible:ring-[#347B85] rounded-xl bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-1">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Por favor contacte al administrador del sistema para restablecer su contraseña.");
                  }}
                  className="text-xs font-semibold text-[#00A8B5] hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm sm:text-base font-semibold bg-[#E6007E] hover:bg-[#C7006B] active:bg-[#A8005B] text-white rounded-xl shadow-xs transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Ingresando...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          {/* Secure Access Footer */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-400 font-medium">
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            <span>Acceso seguro · INKA FISH</span>
          </div>
        </div>

        {/* DEMO USERS COLLAPSIBLE SELECTOR */}
        <div className="w-full max-w-md mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-teal-700 transition-colors py-1 px-3 rounded-lg hover:bg-gray-200/50"
          >
            <span>Modo Demostración (Usuarios de prueba)</span>
            {showDemo ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {showDemo && (
            <div className="mt-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-1.5 text-left animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-[11px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                Selecciona un rol de prueba (clave: admin123):
              </p>
              {demoUsers.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword(u.password);
                    setError("");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-teal-50 hover:text-teal-800 rounded-lg transition-colors border border-transparent hover:border-teal-200"
                >
                  <span className="font-semibold text-teal-900">{u.role}</span>
                  <span className="text-gray-400 text-[11px]">{u.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
