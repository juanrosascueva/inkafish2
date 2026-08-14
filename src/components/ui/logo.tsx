import React from "react";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant?: "full" | "icon" | "horizontal";
  className?: string;
  lightMode?: boolean; // true if rendering on dark background (white text)
  tagline?: string;
};

export function InkaFishLogo({
  variant = "full",
  className,
  lightMode = false,
  tagline = "Orgullo de comer como en casa",
}: LogoProps) {
  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 140 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-10 h-10 shrink-0", className)}
      >
        {/* Tail (Teal #347B85) */}
        <path d="M 38 20 L 15 28 L 38 48 Z" fill="#347B85" />
        <path d="M 38 52 L 15 72 L 38 80 Z" fill="#347B85" />
        <polygon points="38,32 48,32 48,68 38,68" fill="#347B85" />

        {/* Top Fin (Magenta #E6007E) */}
        <path d="M 68 12 L 85 24 L 72 24 Z" fill="#E6007E" />

        {/* Bottom Fin (Magenta #E6007E) */}
        <path d="M 68 88 L 85 76 L 72 76 Z" fill="#E6007E" />

        {/* Body Stepped Outer (Magenta #E6007E) */}
        <rect x="48" y="24" width="24" height="12" fill="#E6007E" />
        <rect x="72" y="24" width="16" height="12" fill="#E6007E" />
        <rect x="48" y="36" width="12" height="12" fill="#E6007E" />
        <rect x="48" y="52" width="12" height="12" fill="#E6007E" />
        <rect x="48" y="64" width="24" height="12" fill="#E6007E" />
        <rect x="72" y="64" width="16" height="12" fill="#E6007E" />
        <rect x="72" y="36" width="12" height="12" fill="#E6007E" />
        <rect x="72" y="52" width="12" height="12" fill="#E6007E" />

        {/* Center Diamond Motif (Warm Gold #F5921E) */}
        <rect x="60" y="36" width="12" height="12" fill="#F5921E" />
        <rect x="60" y="52" width="12" height="12" fill="#F5921E" />
        <rect x="54" y="44" width="12" height="12" fill="#F5921E" stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="66" y="44" width="12" height="12" fill="#F5921E" stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="60" y="44" width="12" height="12" fill="#F5921E" />

        {/* Head / Mouth (Teal #347B85) */}
        <path d="M 84 32 H 102 L 115 50 L 102 68 H 84 V 56 H 88 V 44 H 84 Z" fill="#347B85" />
        {/* Eye (White circle) */}
        <circle cx="100" cy="44" r="3.5" fill="#FFFFFF" />
      </svg>
    );
  }

  if (variant === "horizontal") {
    return (
      <div className={cn("flex items-center gap-3 select-none", className)}>
        <svg
          viewBox="0 0 140 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 shrink-0"
        >
          <path d="M 38 20 L 15 28 L 38 48 Z" fill="#347B85" />
          <path d="M 38 52 L 15 72 L 38 80 Z" fill="#347B85" />
          <polygon points="38,32 48,32 48,68 38,68" fill="#347B85" />
          <path d="M 68 12 L 85 24 L 72 24 Z" fill="#E6007E" />
          <path d="M 68 88 L 85 76 L 72 76 Z" fill="#E6007E" />
          <rect x="48" y="24" width="24" height="12" fill="#E6007E" />
          <rect x="72" y="24" width="16" height="12" fill="#E6007E" />
          <rect x="48" y="36" width="12" height="12" fill="#E6007E" />
          <rect x="48" y="52" width="12" height="12" fill="#E6007E" />
          <rect x="48" y="64" width="24" height="12" fill="#E6007E" />
          <rect x="72" y="64" width="16" height="12" fill="#E6007E" />
          <rect x="72" y="36" width="12" height="12" fill="#E6007E" />
          <rect x="72" y="52" width="12" height="12" fill="#E6007E" />
          <rect x="60" y="36" width="12" height="12" fill="#F5921E" />
          <rect x="60" y="52" width="12" height="12" fill="#F5921E" />
          <rect x="54" y="44" width="12" height="12" fill="#F5921E" stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="66" y="44" width="12" height="12" fill="#F5921E" stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="60" y="44" width="12" height="12" fill="#F5921E" />
          <path d="M 84 32 H 102 L 115 50 L 102 68 H 84 V 56 H 88 V 44 H 84 Z" fill="#347B85" />
          <circle cx="100" cy="44" r="3.5" fill="#FFFFFF" />
        </svg>
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight tracking-tight">
            <span className={lightMode ? "text-white" : "text-gray-900"}>Inka </span>
            <span className={lightMode ? "text-teal-200" : "text-gray-700"}>Fish</span>
          </span>
          <span className="text-[10px] italic font-serif text-teal-400 leading-tight">
            {tagline}
          </span>
        </div>
      </div>
    );
  }

  // Full stacked logo
  return (
    <div className={cn("flex flex-col items-center text-center select-none", className)}>
      <svg
        viewBox="0 0 140 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-16 h-16 shrink-0 mb-1"
      >
        <path d="M 38 20 L 15 28 L 38 48 Z" fill="#347B85" />
        <path d="M 38 52 L 15 72 L 38 80 Z" fill="#347B85" />
        <polygon points="38,32 48,32 48,68 38,68" fill="#347B85" />
        <path d="M 68 12 L 85 24 L 72 24 Z" fill="#E6007E" />
        <path d="M 68 88 L 85 76 L 72 76 Z" fill="#E6007E" />
        <rect x="48" y="24" width="24" height="12" fill="#E6007E" />
        <rect x="72" y="24" width="16" height="12" fill="#E6007E" />
        <rect x="48" y="36" width="12" height="12" fill="#E6007E" />
        <rect x="48" y="52" width="12" height="12" fill="#E6007E" />
        <rect x="48" y="64" width="24" height="12" fill="#E6007E" />
        <rect x="72" y="64" width="16" height="12" fill="#E6007E" />
        <rect x="72" y="36" width="12" height="12" fill="#E6007E" />
        <rect x="72" y="52" width="12" height="12" fill="#E6007E" />
        <rect x="60" y="36" width="12" height="12" fill="#F5921E" />
        <rect x="60" y="52" width="12" height="12" fill="#F5921E" />
        <rect x="54" y="44" width="12" height="12" fill="#F5921E" stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="66" y="44" width="12" height="12" fill="#F5921E" stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="60" y="44" width="12" height="12" fill="#F5921E" />
        <path d="M 84 32 H 102 L 115 50 L 102 68 H 84 V 56 H 88 V 44 H 84 Z" fill="#347B85" />
        <circle cx="100" cy="44" r="3.5" fill="#FFFFFF" />
      </svg>
      <div className="font-extrabold text-2xl tracking-tight leading-tight">
        <span className={lightMode ? "text-white" : "text-gray-900"}>Inka </span>
        <span className={lightMode ? "text-teal-200" : "text-gray-700"}>Fish</span>
      </div>
      <div className={cn("text-xs italic font-serif font-medium mt-0.5", lightMode ? "text-teal-300" : "text-teal-600")}>
        {tagline}
      </div>
    </div>
  );
}
