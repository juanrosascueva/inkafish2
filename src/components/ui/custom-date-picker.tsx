"use client";
import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  type?: "date" | "datetime-local";
  className?: string;
  placeholder?: string;
}

export function CustomDatePicker({
  value,
  onChange,
  min,
  max,
  required = false,
  disabled = false,
  type = "date",
  className,
}: CustomDatePickerProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full h-10 pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm text-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-[#1b6970] focus:border-[#1b6970]",
          disabled && "bg-gray-100 opacity-60 cursor-not-allowed"
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#1b6970]">
        <CalendarIcon className="h-4 w-4" />
      </div>
    </div>
  );
}
