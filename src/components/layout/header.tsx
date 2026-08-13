"use client";
import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type HeaderProps = {
  title: string;
  user: { name: string; role: string };
};

export function Header({ title, user }: HeaderProps) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        const n = (d.notifications ?? []).filter((n: { read: boolean }) => !n.read).length;
        setUnread(n);
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <h1 className="text-lg lg:text-xl font-semibold text-gray-900 ml-12 lg:ml-0">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-teal-50 transition-colors">
          <Bell className="h-5 w-5 text-gray-600 hover:text-teal-700" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#E6007E] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#347B85] flex items-center justify-center shadow-xs">
            <span className="text-white text-sm font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-teal-700 font-medium capitalize">{user.role.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
