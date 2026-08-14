"use client";
import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = {
  value: string;
  label: string;
  sublabel?: string;
  code?: string;
  badge?: string;
};

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.code && opt.code.toLowerCase().includes(search.toLowerCase())) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full h-10 px-3 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-between text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1b6970] focus:border-[#1b6970]",
          open && "ring-2 ring-[#1b6970] border-[#1b6970]",
          disabled && "bg-gray-100 opacity-60 cursor-not-allowed"
        )}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              {selectedOption.code && (
                <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {selectedOption.code}
                </span>
              )}
              <span className="font-medium text-gray-900">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-xs text-gray-400">({selectedOption.sublabel})</span>
              )}
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="p-2 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1b6970] text-gray-800"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 flex flex-col items-center gap-1">
                <Package className="h-6 w-6 text-gray-300" />
                No se encontraron opciones
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors",
                      isSelected
                        ? "bg-[#1b6970] text-white font-medium"
                        : "hover:bg-teal-50 text-gray-800 hover:text-[#1b6970]"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.code && (
                        <span
                          className={cn(
                            "font-mono px-1.5 py-0.5 rounded text-[10px]",
                            isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {opt.code}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                      {opt.sublabel && (
                        <span className={cn("text-[11px]", isSelected ? "text-teal-100" : "text-gray-400")}>
                          · {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
