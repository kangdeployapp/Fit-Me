"use client";

import React from "react";
import { LayoutDashboard, Droplets, Utensils, Footprints, Scale } from "lucide-react";

export type NavCategory = "dashboard" | "water" | "breakfast" | "steps" | "weight";

interface BottomNavProps {
  activeCategory: NavCategory;
  onChangeCategory: (cat: NavCategory) => void;
}

export function BottomNav({ activeCategory, onChangeCategory }: BottomNavProps) {
  const navItems: { id: NavCategory; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: "dashboard",
      label: "แดชบอร์ด",
      icon: <LayoutDashboard className="h-5 w-5" />,
      color: "text-blue-600",
    },
    {
      id: "water",
      label: "ดื่มน้ำ",
      icon: <Droplets className="h-5 w-5" />,
      color: "text-cyan-600",
    },
    {
      id: "breakfast",
      label: "อาหารเช้า",
      icon: <Utensils className="h-5 w-5" />,
      color: "text-orange-600",
    },
    {
      id: "steps",
      label: "ก้าวเดิน",
      icon: <Footprints className="h-5 w-5" />,
      color: "text-purple-600",
    },
    {
      id: "weight",
      label: "น้ำหนัก",
      icon: <Scale className="h-5 w-5" />,
      color: "text-emerald-600",
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-200/60 pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-between py-2 px-3">
        {navItems.map((item) => {
          const isActive = activeCategory === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeCategory(item.id)}
              className={`flex-1 flex flex-col items-center py-1 transition-all ${
                isActive
                  ? `${item.color} scale-105 font-bold`
                  : "text-gray-400 hover:text-gray-600 font-medium"
              }`}
            >
              {item.icon}
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
