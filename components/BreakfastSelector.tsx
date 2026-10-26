"use client";

import React, { useState } from "react";
import { Utensils, Flame, Sparkles, Check, Egg, Salad, Fish, Coffee } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  category: "protein" | "low_carb" | "low_cal";
  categoryLabel: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  icon: string;
}

const BREAKFAST_MENU: MenuItem[] = [
  {
    id: "1",
    name: "ไข่ต้ม 2 ฟอง + อะโวคาโด + ขนมปังโฮลวีต",
    category: "protein",
    categoryLabel: "โปรตีนสูง",
    kcal: 340,
    proteinG: 18,
    carbsG: 16,
    icon: "🥑",
  },
  {
    id: "2",
    name: "อกไก่ย่างสมุนไพร + สลัดผักน้ำสลัดบัลซามิก",
    category: "low_carb",
    categoryLabel: "คาร์บต่ำ",
    kcal: 280,
    proteinG: 32,
    carbsG: 6,
    icon: "🥗",
  },
  {
    id: "3",
    name: "กรีกโยเกิร์ตแท้ + ผลไม้ตระกูลเบอร์รี่รวม + เมล็ดเจีย",
    category: "protein",
    categoryLabel: "โปรตีนสูง",
    kcal: 220,
    proteinG: 16,
    carbsG: 14,
    icon: "🫐",
  },
  {
    id: "4",
    name: "ข้าวต้มข้าวกล้องปลาแซลมอน ผักชีขิงซอย",
    category: "low_cal",
    categoryLabel: "แคลอรี่ต่ำ",
    kcal: 295,
    proteinG: 22,
    carbsG: 24,
    icon: "🐟",
  },
  {
    id: "5",
    name: "ไข่กระทะทรงเครื่องไร้น้ำมัน (อกไก่สับ + เห็ดหอม)",
    category: "low_carb",
    categoryLabel: "คาร์บต่ำ",
    kcal: 230,
    proteinG: 21,
    carbsG: 4,
    icon: "🍳",
  },
  {
    id: "6",
    name: "โอเวอร์ไนท์โอ๊ต (ข้าวโอ๊ต + นมอัลมอนด์ + กล้วยหอม)",
    category: "low_cal",
    categoryLabel: "แคลอรี่ต่ำ",
    kcal: 260,
    proteinG: 9,
    carbsG: 38,
    icon: "🥣",
  },
];

export function BreakfastSelector() {
  const [activeFilter, setActiveFilter] = useState<"all" | "protein" | "low_carb" | "low_cal">("all");
  const [selectedMeal, setSelectedMeal] = useState<MenuItem | null>(BREAKFAST_MENU[0]);
  const [isLogged, setIsLogged] = useState(false);

  const filteredItems = BREAKFAST_MENU.filter((item) => {
    if (activeFilter === "all") return true;
    return item.category === activeFilter;
  });

  const handleSelectMeal = (meal: MenuItem) => {
    setSelectedMeal(meal);
    setIsLogged(true);
    setTimeout(() => setIsLogged(false), 2500);
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">เมนูอาหารเช้าเพื่อสุขภาพ</h3>
            <p className="text-xs text-gray-500">เลือกอาหารเช้าที่คุณทานวันนี้เพื่อบันทึกสารอาหาร</p>
          </div>
        </div>
        {selectedMeal && (
          <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600">
            {selectedMeal.kcal} kcal
          </span>
        )}
      </div>

      {/* มื้ออาหารเช้าที่บันทึกแล้ววันนี้ */}
      {selectedMeal && (
        <div className="mt-4 rounded-2xl bg-gradient-to-r from-orange-50/70 to-amber-50/70 p-3.5 border border-orange-100/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{selectedMeal.icon}</span>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold text-gray-900 line-clamp-1">
                    {selectedMeal.name}
                  </span>
                  {isLogged && (
                    <span className="rounded-full bg-emerald-500 text-white p-0.5 animate-pulse">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex space-x-3 text-[11px] text-gray-500">
                  <span>
                    โปรตีน <strong className="text-gray-700">{selectedMeal.proteinG}g</strong>
                  </span>
                  <span>
                    คาร์บ <strong className="text-gray-700">{selectedMeal.carbsG}g</strong>
                  </span>
                  <span>
                    พลังงาน <strong className="text-orange-600">{selectedMeal.kcal} kcal</strong>
                  </span>
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              บันทึกแล้ว
            </span>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="mt-4 flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            activeFilter === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          ทั้งหมด
        </button>
        <button
          onClick={() => setActiveFilter("protein")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            activeFilter === "protein"
              ? "bg-orange-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          💪 โปรตีนสูง
        </button>
        <button
          onClick={() => setActiveFilter("low_carb")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            activeFilter === "low_carb"
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🥑 คาร์บต่ำ
        </button>
        <button
          onClick={() => setActiveFilter("low_cal")}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
            activeFilter === "low_cal"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🔥 แคลอรี่ต่ำ
        </button>
      </div>

      {/* รายการเมนูแนะนำ */}
      <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
        {filteredItems.map((item) => {
          const isCurrent = selectedMeal?.id === item.id;
          return (
            <div
              key={item.id}
              onClick={() => handleSelectMeal(item)}
              className={`flex items-center justify-between rounded-2xl p-2.5 transition cursor-pointer border ${
                isCurrent
                  ? "border-orange-300 bg-orange-50/50"
                  : "border-gray-100 bg-gray-50/40 hover:bg-gray-100/60"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <h4 className="text-xs font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-[10px] text-gray-500">
                    โปรตีน {item.proteinG}g • คาร์บ {item.carbsG}g
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-700">{item.kcal} kcal</span>
                <button
                  className={`rounded-full p-1.5 text-xs font-medium transition ${
                    isCurrent
                      ? "bg-orange-500 text-white"
                      : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
