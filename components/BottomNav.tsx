"use client";

import React from "react";
import { LayoutDashboard, Utensils, UserCircle } from "lucide-react";

export type NavTab = "overview" | "breakfast" | "profile";

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/85 backdrop-blur-xl border-t border-gray-200/60 pb-safe">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2 px-4">
        {/* Tab 1: หน้าหลัก */}
        <button
          onClick={() => onChangeTab("overview")}
          className={`flex flex-col items-center space-y-1 transition ${
            activeTab === "overview"
              ? "text-blue-600 scale-105 font-bold"
              : "text-gray-400 hover:text-gray-700 font-medium"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px]">หน้าหลัก</span>
        </button>

        {/* Tab 2: เมนูอาหารเช้า */}
        <button
          onClick={() => onChangeTab("breakfast")}
          className={`flex flex-col items-center space-y-1 transition ${
            activeTab === "breakfast"
              ? "text-orange-600 scale-105 font-bold"
              : "text-gray-400 hover:text-gray-700 font-medium"
          }`}
        >
          <Utensils className="h-5 w-5" />
          <span className="text-[10px]">เมนูอาหารเช้า</span>
        </button>

        {/* Tab 3: ข้อมูลส่วนตัว */}
        <button
          onClick={() => onChangeTab("profile")}
          className={`flex flex-col items-center space-y-1 transition ${
            activeTab === "profile"
              ? "text-indigo-600 scale-105 font-bold"
              : "text-gray-400 hover:text-gray-700 font-medium"
          }`}
        >
          <UserCircle className="h-5 w-5" />
          <span className="text-[10px]">ข้อมูลส่วนตัว</span>
        </button>
      </div>
    </nav>
  );
}
