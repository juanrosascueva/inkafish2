"use client";
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CustomSelectOption = {
  value: string;
  label: string;
};

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccionar...",
  disabled = false,
  className,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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
        <span className="truncate">
          {selectedOption ? (
            <span className="font-medium text-gray-900">{selectedOption.label}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 p-1 space-y-0.5 max-h-56 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors",
                  isSelected
                    ? "bg-[#1b6970] text-white font-medium"
                    : "hover:bg-teal-50 text-gray-800 hover:text-[#1b6970]"
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
