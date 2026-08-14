"use client";
import React, { useState, useRef } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al subir imagen");
      }

      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "No se pudo subir la imagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled || loading}
      />

      {value ? (
        <div className="relative w-36 h-36 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Foto del producto"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || loading}
            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 transition-opacity shadow"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-gray-50/50 hover:bg-blue-50/30 transition-colors ${
            loading || disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <p className="text-xs text-gray-500 font-medium">Subiendo a Cloudinary...</p>
            </>
          ) : (
            <>
              <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-gray-700">Haz clic para subir foto del producto</p>
              <p className="text-[11px] text-gray-400">PNG, JPG o WEBP (Máx 5MB)</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
