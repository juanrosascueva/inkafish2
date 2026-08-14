"use client";
import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomDatePickerProps {
  value: string; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  type?: "date" | "datetime-local";
  className?: string;
  placeholder?: string;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const WEEKDAY_NAMES = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];

export function CustomDatePicker({
  value,
  onChange,
  min,
  max,
  disabled = false,
  type = "date",
  className,
  placeholder = "dd/mm/aaaa",
}: CustomDatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view date
  const parseDate = (valStr: string) => {
    if (!valStr) return new Date();
    const d = new Date(valStr.includes("T") ? valStr : `${valStr}T00:00:00`);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const selectedDate = value ? parseDate(value) : null;
  const [viewDate, setViewDate] = useState<Date>(selectedDate || new Date());
  const [timeStr, setTimeStr] = useState<string>(
    value && value.includes("T") ? value.split("T")[1].slice(0, 5) : "12:00"
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

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarCells: { date: Date; currentMonth: boolean }[] = [];

  // Prev month cells
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarCells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      currentMonth: false,
    });
  }

  // Current month cells
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      date: new Date(year, month, d),
      currentMonth: true,
    });
  }

  // Next month cells to fill grid (42 cells total for 6 rows)
  const remaining = 42 - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    calendarCells.push({
      date: new Date(year, month + 1, d),
      currentMonth: false,
    });
  }

  const formatOutput = (d: Date, t: string = timeStr) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    if (type === "datetime-local") {
      return `${y}-${m}-${day}T${t}`;
    }
    return `${y}-${m}-${day}`;
  };

  const handleSelectDay = (cellDate: Date) => {
    const formatted = formatOutput(cellDate);
    // Min/Max check
    if (min && formatted < min) return;
    if (max && formatted > max) return;

    onChange(formatted);
    if (type === "date") {
      setOpen(false);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    onChange(formatOutput(today));
    if (type === "date") setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  // Formatted label for display
  const displayLabel = () => {
    if (!value) return null;
    const d = parseDate(value);
    const day = String(d.getDate()).padStart(2, "0");
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const y = d.getFullYear();
    if (type === "datetime-local") {
      const time = value.includes("T") ? value.split("T")[1].slice(0, 5) : "";
      return `${day}/${m}/${y} ${time}`;
    }
    return `${day}/${m}/${y}`;
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (d: Date) => {
    if (!selectedDate) return false;
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (selectedDate) setViewDate(selectedDate);
          setOpen(!open);
        }}
        className={cn(
          "w-full h-10 px-3 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-between text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1b6970] focus:border-[#1b6970]",
          open && "ring-2 ring-[#1b6970] border-[#1b6970]",
          disabled && "bg-gray-100 opacity-60 cursor-not-allowed"
        )}
      >
        <span className="truncate">
          {displayLabel() ? (
            <span className="font-semibold text-gray-900">{displayLabel()}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </span>
        <CalendarIcon className="h-4 w-4 text-[#1b6970] flex-shrink-0 ml-2" />
      </button>

      {/* Floating Popover Calendar */}
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden p-3 animate-in fade-in-50 zoom-in-95 duration-150 select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-teal-50 text-[#1b6970] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-gray-900">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-teal-50 text-[#1b6970] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {WEEKDAY_NAMES.map((w) => (
              <span key={w} className="text-[10px] font-bold text-[#1b6970]">
                {w}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const selected = isSelected(cell.date);
              const today = isToday(cell.date);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(cell.date)}
                  className={cn(
                    "h-8 w-full rounded-lg text-xs flex items-center justify-center font-medium transition-all",
                    !cell.currentMonth && "text-gray-300",
                    cell.currentMonth && !selected && "text-gray-700 hover:bg-teal-50 hover:text-[#1b6970]",
                    today && !selected && "border border-[#1b6970] font-bold text-[#1b6970]",
                    selected && "bg-[#1b6970] text-white font-bold shadow-md hover:bg-[#15545a]"
                  )}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Time Picker (if datetime-local) */}
          {type === "datetime-local" && (
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-600">Hora:</span>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => {
                  setTimeStr(e.target.value);
                  if (selectedDate) {
                    onChange(formatOutput(selectedDate, e.target.value));
                  }
                }}
                className="h-7 px-2 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-[#1b6970] focus:border-[#1b6970]"
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100 text-xs">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-500 hover:text-red-600 font-medium transition-colors"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-[#1b6970] font-bold hover:underline"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
