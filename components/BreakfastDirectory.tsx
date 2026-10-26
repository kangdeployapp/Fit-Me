"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Utensils,
  Flame,
  Check,
  Plus,
  Info,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  Filter,
} from "lucide-react";
import { BreakfastMeal, MealCategory } from "@/types";
import { ALL_BREAKFAST_MEALS, BREAKFAST_CATEGORIES, CategoryInfo } from "@/data/breakfastMeals";
import { supabase } from "@/lib/supabase";

interface BreakfastDirectoryProps {
  onMealSelected?: (meal: BreakfastMeal) => void;
}

export function BreakfastDirectory({ onMealSelected }: BreakfastDirectoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<MealCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [todayLoggedMeal, setTodayLoggedMeal] = useState<BreakfastMeal | null>(null);
  const [inspectingMeal, setInspectingMeal] = useState<BreakfastMeal | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ข้อมูลเมนูที่ผู้ใช้สร้างเอง
  const [customMeals, setCustomMeals] = useState<BreakfastMeal[]>([]);
  const [customForm, setCustomForm] = useState({
    name: "",
    kcal: "",
    proteinG: "",
    carbsG: "",
    fatG: "",
  });

  // โหลดมื้อที่บันทึกไว้ใน localStorage / Supabase
  useEffect(() => {
    const savedMealJson = localStorage.getItem("fitlife_today_breakfast");
    if (savedMealJson) {
      try {
        setTodayLoggedMeal(JSON.parse(savedMealJson));
      } catch (e) {}
    } else {
      setTodayLoggedMeal(ALL_BREAKFAST_MEALS[0]);
    }

    const savedCustoms = localStorage.getItem("fitlife_custom_breakfasts");
    if (savedCustoms) {
      try {
        setCustomMeals(JSON.parse(savedCustoms));
      } catch (e) {}
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // รวมเมนูเริ่มต้น + เมนูที่ผู้ใช้สร้างเอง
  const combinedMeals = [...customMeals, ...ALL_BREAKFAST_MEALS];

  // คัดกรองตามหมวดหมู่และการค้นหา
  const filteredMeals = combinedMeals.filter((meal) => {
    const matchesCategory = selectedCategory === "all" || meal.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      q === "" ||
      meal.name.toLowerCase().includes(q) ||
      meal.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      meal.description.toLowerCase().includes(q);

    return matchesCategory && matchesQuery;
  });

  // ฟังก์ชันเลือกและบันทึกมื้ออาหารเช้า
  const handleSelectMeal = async (meal: BreakfastMeal) => {
    setTodayLoggedMeal(meal);
    localStorage.setItem("fitlife_today_breakfast", JSON.stringify(meal));
    if (onMealSelected) onMealSelected(meal);

    showToast(`บันทึก "${meal.name}" เป็นมื้อเช้าเรียบร้อยแล้ว!`);

    // บันทึกลง Supabase daily_habits
    try {
      await supabase.from("daily_habits").upsert(
        {
          date: new Date().toISOString().split("T")[0],
          breakfast_meal: meal.name,
          breakfast_kcal: meal.kcal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date" }
      );
    } catch (err) {
      console.warn("Supabase habit update:", err);
    }
  };

  // บันทึกเมนูอาหารใหม่ที่ผู้ใช้กำหนดเอง
  const handleCreateCustomMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customForm.name || !customForm.kcal) return;

    const newMeal: BreakfastMeal = {
      id: `custom-${Date.now()}`,
      name: customForm.name,
      category: "quick_easy",
      categoryLabel: "เมนูของฉัน",
      icon: "🍽️",
      kcal: Number(customForm.kcal) || 250,
      proteinG: Number(customForm.proteinG) || 15,
      carbsG: Number(customForm.carbsG) || 20,
      fatG: Number(customForm.fatG) || 8,
      fiberG: 3,
      tags: ["เมนูตัวเอง", "คัสตอม"],
      description: "เมนูสุขภาพที่คุณกำหนดส่วนผสมเองตามต้องการ",
      cookingTimeMinutes: 5,
      difficulty: "ง่าย",
      highlights: ["กำหนดสัดส่วนสารอาหารได้เอง"],
    };

    const updated = [newMeal, ...customMeals];
    setCustomMeals(updated);
    localStorage.setItem("fitlife_custom_breakfasts", JSON.stringify(updated));
    setIsCustomModalOpen(false);
    setCustomForm({ name: "", kcal: "", proteinG: "", carbsG: "", fatG: "" });
    handleSelectMeal(newMeal);
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 inset-x-4 z-50 mx-auto max-w-sm rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-semibold text-white shadow-xl flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hero: มื้อเช้าที่บันทึกแล้ววันนี้ */}
      {todayLoggedMeal && (
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-5 text-white shadow-ios">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-100 flex items-center space-x-1">
              <Sparkles className="h-3 w-3" />
              <span>มื้อเช้าที่คุณเลือกทานวันนี้</span>
            </span>
            <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold">
              {todayLoggedMeal.kcal} kcal
            </span>
          </div>

          <div className="mt-3 flex items-start space-x-3">
            <span className="text-3xl">{todayLoggedMeal.icon}</span>
            <div className="flex-1">
              <h3 className="text-base font-bold leading-tight drop-shadow-sm">
                {todayLoggedMeal.name}
              </h3>
              <p className="mt-1 text-xs text-orange-100 line-clamp-2">
                {todayLoggedMeal.description}
              </p>
            </div>
          </div>

          {/* สัดส่วนสารอาหารหลัก Macro Bar */}
          <div className="mt-4 grid grid-cols-4 gap-2 border-t border-white/20 pt-3 text-center text-xs">
            <div className="rounded-xl bg-white/15 p-2">
              <span className="block text-[10px] text-orange-100">โปรตีน</span>
              <strong className="text-sm font-black">{todayLoggedMeal.proteinG}g</strong>
            </div>
            <div className="rounded-xl bg-white/15 p-2">
              <span className="block text-[10px] text-orange-100">คาร์บ</span>
              <strong className="text-sm font-black">{todayLoggedMeal.carbsG}g</strong>
            </div>
            <div className="rounded-xl bg-white/15 p-2">
              <span className="block text-[10px] text-orange-100">ไขมัน</span>
              <strong className="text-sm font-black">{todayLoggedMeal.fatG}g</strong>
            </div>
            <div className="rounded-xl bg-white/15 p-2">
              <span className="block text-[10px] text-orange-100">ไฟเบอร์</span>
              <strong className="text-sm font-black">{todayLoggedMeal.fiberG}g</strong>
            </div>
          </div>
        </div>
      )}

      {/* ช่องค้นหา & ปุ่มเพิ่มเมนูของฉัน */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาเมนู เช่น ไข่, แซลมอน, เซเว่น..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-gray-900 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsCustomModalOpen(true)}
          className="flex items-center space-x-1 rounded-2xl bg-orange-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-orange-700 active:scale-95 transition flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>เพิ่มเมนู</span>
        </button>
      </div>

      {/* แถบหมวดหมู่อาหารเช้า (Category Horizontal Scroll) */}
      <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`flex items-center space-x-1.5 rounded-full px-4 py-2 text-xs font-bold transition flex-shrink-0 ${
            selectedCategory === "all"
              ? "bg-gray-900 text-white shadow"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <span>🍽️ ทั้งหมด ({combinedMeals.length})</span>
        </button>

        {BREAKFAST_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center space-x-1.5 rounded-full px-4 py-2 text-xs font-bold transition flex-shrink-0 ${
                isSelected
                  ? `${cat.bgColor} ${cat.color} border-2 ${cat.borderColor} shadow-sm`
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* ข้อมูลหมวดหมู่ที่เลือก (Category Description banner) */}
      {selectedCategory !== "all" && (
        <div className="rounded-2xl bg-white p-3 border border-gray-100 shadow-sm text-xs">
          {BREAKFAST_CATEGORIES.filter((c) => c.id === selectedCategory).map((c) => (
            <div key={c.id} className="flex items-center space-x-2 text-gray-600">
              <span className="text-base">{c.icon}</span>
              <span>
                <strong className={c.color}>{c.name}:</strong> {c.description}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* รายการเมนูอาหารทั้งหมด (Menu Cards Grid) */}
      <div className="space-y-3">
        {filteredMeals.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center border border-gray-100">
            <span className="text-4xl">🔍</span>
            <p className="mt-2 text-sm font-semibold text-gray-700">ไม่พบเมนูที่คุณค้นหา</p>
            <p className="text-xs text-gray-400 mt-1">
              ลองค้นหาด้วยคำอื่น หรือกดปุ่ม &ldquo;+ เพิ่มเมนู&rdquo; ด้านบนได้เลยครับ
            </p>
          </div>
        ) : (
          filteredMeals.map((meal) => {
            const isCurrentlyLogged = todayLoggedMeal?.name === meal.name;
            return (
              <div
                key={meal.id}
                className={`rounded-3xl bg-white p-4 shadow-ios border transition-all ${
                  isCurrentlyLogged
                    ? "border-orange-500 ring-2 ring-orange-200"
                    : "border-gray-100 hover:border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-3xl">{meal.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                          {meal.categoryLabel}
                        </span>
                        <div className="flex items-center space-x-1 text-[10px] text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>{meal.cookingTimeMinutes} นาที</span>
                        </div>
                      </div>

                      <h4 className="mt-1 text-sm font-bold text-gray-900 leading-snug">
                        {meal.name}
                      </h4>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                        {meal.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right ml-2 flex-shrink-0">
                    <span className="text-base font-extrabold text-orange-600">
                      {meal.kcal}
                    </span>
                    <span className="block text-[10px] text-gray-400">kcal</span>
                  </div>
                </div>

                {/* Macro Badges */}
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                  <div className="flex space-x-2 text-[11px]">
                    <span className="rounded-lg bg-orange-50 px-2 py-0.5 font-semibold text-orange-700">
                      P: {meal.proteinG}g
                    </span>
                    <span className="rounded-lg bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                      C: {meal.carbsG}g
                    </span>
                    <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-semibold text-amber-700">
                      F: {meal.fatG}g
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setInspectingMeal(meal)}
                      className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200 transition"
                      title="ดูคุณค่าทางโภชนาการ"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleSelectMeal(meal)}
                      className={`inline-flex items-center space-x-1 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                        isCurrentlyLogged
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
                      }`}
                    >
                      {isCurrentlyLogged ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>เลือกแล้ว</span>
                        </>
                      ) : (
                        <span>เลือกทานมื้อนี้</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Sheet แสดงข้อมูลโภชนาการแบบละเอียด (Nutrition Inspection Modal) */}
      {inspectingMeal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-4xl">{inspectingMeal.icon}</span>
                <div>
                  <span className="text-[11px] font-bold text-orange-600">
                    {inspectingMeal.categoryLabel}
                  </span>
                  <h3 className="text-base font-bold text-gray-900">{inspectingMeal.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setInspectingMeal(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-600 leading-relaxed">
              {inspectingMeal.description}
            </p>

            {/* Macro Breakdown */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-2xl bg-orange-50 p-2.5">
                <span className="block text-[10px] text-gray-500">พลังงาน</span>
                <strong className="text-base font-black text-orange-600">
                  {inspectingMeal.kcal}
                </strong>
                <span className="text-[9px] text-gray-400 block">kcal</span>
              </div>
              <div className="rounded-2xl bg-blue-50 p-2.5">
                <span className="block text-[10px] text-gray-500">โปรตีน</span>
                <strong className="text-base font-black text-blue-600">
                  {inspectingMeal.proteinG}g
                </strong>
                <span className="text-[9px] text-gray-400 block">กรัม</span>
              </div>
              <div className="rounded-2xl bg-amber-50 p-2.5">
                <span className="block text-[10px] text-gray-500">คาร์บ</span>
                <strong className="text-base font-black text-amber-600">
                  {inspectingMeal.carbsG}g
                </strong>
                <span className="text-[9px] text-gray-400 block">กรัม</span>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-2.5">
                <span className="block text-[10px] text-gray-500">ไขมัน</span>
                <strong className="text-base font-black text-emerald-600">
                  {inspectingMeal.fatG}g
                </strong>
                <span className="text-[9px] text-gray-400 block">กรัม</span>
              </div>
            </div>

            {/* จุดเด่น & เคล็ดลับสุขภาพ */}
            <div className="mt-4 rounded-2xl bg-gray-50 p-3 text-xs">
              <span className="font-bold text-gray-800">จุดเด่นของเมนูนี้:</span>
              <ul className="mt-1 space-y-1 text-gray-600">
                {inspectingMeal.highlights.map((h, i) => (
                  <li key={i} className="flex items-center space-x-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex space-x-3">
              <button
                onClick={() => {
                  handleSelectMeal(inspectingMeal);
                  setInspectingMeal(null);
                }}
                className="flex-1 rounded-2xl bg-orange-600 py-3 text-xs font-bold text-white shadow-md hover:bg-orange-700 active:scale-95 transition"
              >
                บันทึกเป็นมื้อเช้าของฉันวันนี้
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal สำหรับสร้างเมนูอาหารเช้าด้วยตัวเอง */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">เพิ่มเมนูอาหารเช้าของคุณ</h3>
              <button onClick={() => setIsCustomModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomMeal} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">ชื่อเมนู</label>
                <input
                  type="text"
                  placeholder="เช่น ต้มเลือดหมูไม่ใส่เครื่องใน"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                  required
                  className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600">พลังงาน (kcal)</label>
                  <input
                    type="number"
                    placeholder="250"
                    value={customForm.kcal}
                    onChange={(e) => setCustomForm({ ...customForm, kcal: e.target.value })}
                    required
                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">โปรตีน (กรัม)</label>
                  <input
                    type="number"
                    placeholder="20"
                    value={customForm.proteinG}
                    onChange={(e) => setCustomForm({ ...customForm, proteinG: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600">คาร์โบไฮเดรต (g)</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={customForm.carbsG}
                    onChange={(e) => setCustomForm({ ...customForm, carbsG: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">ไขมัน (g)</label>
                  <input
                    type="number"
                    placeholder="6"
                    value={customForm.fatG}
                    onChange={(e) => setCustomForm({ ...customForm, fatG: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-orange-600 py-3 text-xs font-bold text-white shadow hover:bg-orange-700 active:scale-95 transition"
                >
                  บันทึกและเลือกทานมื้อนี้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
