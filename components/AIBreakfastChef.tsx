"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Bot,
  ChefHat,
  Loader2,
  Check,
  Plus,
  Flame,
  Clock,
  ArrowRight,
  Search,
  X,
} from "lucide-react";
import { BreakfastMeal, UserProfile } from "@/types";

interface AIBreakfastChefProps {
  userProfile?: UserProfile;
  onMealGeneratedAndSelected: (meal: BreakfastMeal) => void;
  onClose?: () => void;
}

export function AIBreakfastChef({
  userProfile,
  onMealGeneratedAndSelected,
  onClose,
}: AIBreakfastChefProps) {
  const [tab, setTab] = useState<"ingredients" | "analyze" | "goal">("ingredients");
  const [ingredientsInput, setIngredientsInput] = useState("");
  const [mealNameInput, setMealNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMeal, setGeneratedMeal] = useState<BreakfastMeal | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = async (mode: "generate_from_ingredients" | "analyze_meal" | "recommend_for_user") => {
    setIsLoading(true);
    setGeneratedMeal(null);
    setIsSaved(false);

    try {
      const res = await fetch("/api/ai-breakfast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ingredients: ingredientsInput,
          mealName: mealNameInput,
          userProfile,
        }),
      });

      const data = await res.json();
      if (res.ok && data.meal) {
        const meal: BreakfastMeal = {
          id: `ai-${Date.now()}`,
          name: data.meal.name,
          category: data.meal.category || "high_protein",
          categoryLabel: data.meal.categoryLabel || "เมนูสร้างโดย AI",
          icon: data.meal.icon || "🍳",
          kcal: data.meal.kcal,
          proteinG: data.meal.proteinG,
          carbsG: data.meal.carbsG,
          fatG: data.meal.fatG,
          fiberG: data.meal.fiberG || 3,
          tags: ["AI Chef", "ปรับแต่งเฉพาะคุณ"],
          description: data.meal.description,
          cookingTimeMinutes: data.meal.cookingTimeMinutes || 7,
          difficulty: data.meal.difficulty || "ง่าย",
          highlights: data.meal.highlights || ["สารอาหารสมดุล", "พลังงานสะอาด"],
        };
        setGeneratedMeal(meal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectThisMeal = () => {
    if (!generatedMeal) return;
    setIsSaved(true);
    onMealGeneratedAndSelected(generatedMeal);
    setTimeout(() => {
      if (onClose) onClose();
    }, 1200);
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-2xl border border-purple-100 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <h3 className="text-base font-bold text-gray-900">FitLife AI Chef & Nutritionist</h3>
              <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            </div>
            <p className="text-xs text-gray-500">ผู้ช่วย AI คิดเมนูและวิเคราะห์อาหารเช้าสุขภาพ</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Mode Tabs */}
      <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-2xl bg-gray-100 p-1 text-xs">
        <button
          onClick={() => {
            setTab("ingredients");
            setGeneratedMeal(null);
          }}
          className={`rounded-xl py-2 font-bold transition ${
            tab === "ingredients" ? "bg-white text-purple-700 shadow-sm" : "text-gray-600"
          }`}
        >
          🍳 มีวัตถุดิบอะไร
        </button>
        <button
          onClick={() => {
            setTab("analyze");
            setGeneratedMeal(null);
          }}
          className={`rounded-xl py-2 font-bold transition ${
            tab === "analyze" ? "bg-white text-purple-700 shadow-sm" : "text-gray-600"
          }`}
        >
          🔍 วิเคราะห์อาหาร
        </button>
        <button
          onClick={() => {
            setTab("goal");
            setGeneratedMeal(null);
          }}
          className={`rounded-xl py-2 font-bold transition ${
            tab === "goal" ? "bg-white text-purple-700 shadow-sm" : "text-gray-600"
          }`}
        >
          🎯 ตามเป้าหมาย
        </button>
      </div>

      {/* Tab 1: มีวัตถุดิบอะไรบ้าง */}
      {tab === "ingredients" && (
        <div className="mt-4 space-y-3">
          <label className="text-xs font-bold text-gray-700 block">
            พิมพ์วัตถุดิบที่มีในตู้เย็นของคุณ (AI จะคิดเมนูสุขภาพให้):
          </label>
          <input
            type="text"
            placeholder="เช่น ไข่ไก่ 2 ฟอง, อกไก่, ข้าวโอ๊ต, ผักกาดขาว"
            value={ingredientsInput}
            onChange={(e) => setIngredientsInput(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white"
          />
          <button
            onClick={() => handleGenerate("generate_from_ingredients")}
            disabled={isLoading || !ingredientsInput.trim()}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-bold text-white shadow hover:opacity-95 active:scale-95 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI กำลังคิดค้นสูตรอาหาร...</span>
              </>
            ) : (
              <>
                <ChefHat className="h-4 w-4" />
                <span>ให้ AI คิดเมนูอาหารเช้า</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Tab 2: วิเคราะห์อาหารที่ทาน */}
      {tab === "analyze" && (
        <div className="mt-4 space-y-3">
          <label className="text-xs font-bold text-gray-700 block">
            พิมพ์ชื่ออาหารเช้าที่คุณทาน (AI จะคำนวณแคลอรี่และสารอาหารจริง):
          </label>
          <input
            type="text"
            placeholder="เช่น โจ๊กหมูใส่ไข่ไม่ใส่เครื่องใน, ข้าวมันไก่เนื้ออกไม่เอาหนัง"
            value={mealNameInput}
            onChange={(e) => setMealNameInput(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white"
          />
          <button
            onClick={() => handleGenerate("analyze_meal")}
            disabled={isLoading || !mealNameInput.trim()}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-bold text-white shadow hover:opacity-95 active:scale-95 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI กำลังวิเคราะห์คุณค่าทางอาหาร...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>วิเคราะห์สารอาหารมื้อนี้</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Tab 3: แนะนำตามเป้าหมายของฉัน */}
      {tab === "goal" && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-purple-50/60 p-3 text-xs text-purple-900 border border-purple-100">
            <span className="font-bold">ข้อมูลสุขภาพของคุณ:</span>
            <div className="mt-1 text-[11px] text-purple-700">
              เป้าแคลอรี่/วัน: <strong>{userProfile?.dailyKcalTarget || 1650} kcal</strong> • น้ำหนักเป้าหมาย:{" "}
              <strong>{userProfile?.targetWeightKg || 68} กก.</strong>
            </div>
          </div>
          <button
            onClick={() => handleGenerate("recommend_for_user")}
            disabled={isLoading}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-bold text-white shadow hover:opacity-95 active:scale-95 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>AI กำลังคำนวณเมนูที่ตรงเป้าหมาย...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>แนะนำเมนูอาหารเช้าที่เหมาะกับฉัน</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ผลลัพธ์ที่ AI สร้างขึ้น (Generated Meal Card) */}
      {generatedMeal && (
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-4 border border-purple-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <span className="text-3xl">{generatedMeal.icon}</span>
              <div>
                <span className="rounded-full bg-purple-600 text-white px-2 py-0.5 text-[10px] font-bold">
                  {generatedMeal.categoryLabel}
                </span>
                <h4 className="mt-1 text-sm font-bold text-gray-900">{generatedMeal.name}</h4>
                <p className="text-xs text-gray-600 mt-0.5">{generatedMeal.description}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-base font-black text-purple-700">{generatedMeal.kcal}</span>
              <span className="text-[10px] text-gray-400 block">kcal</span>
            </div>
          </div>

          {/* สัดส่วนสารอาหาร */}
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-xl bg-white p-2 border border-purple-100">
              <span className="text-[10px] text-gray-400 block">โปรตีน</span>
              <strong className="text-xs font-bold text-purple-700">{generatedMeal.proteinG}g</strong>
            </div>
            <div className="rounded-xl bg-white p-2 border border-purple-100">
              <span className="text-[10px] text-gray-400 block">คาร์บ</span>
              <strong className="text-xs font-bold text-blue-700">{generatedMeal.carbsG}g</strong>
            </div>
            <div className="rounded-xl bg-white p-2 border border-purple-100">
              <span className="text-[10px] text-gray-400 block">ไขมัน</span>
              <strong className="text-xs font-bold text-amber-700">{generatedMeal.fatG}g</strong>
            </div>
            <div className="rounded-xl bg-white p-2 border border-purple-100">
              <span className="text-[10px] text-gray-400 block">ไฟเบอร์</span>
              <strong className="text-xs font-bold text-emerald-700">{generatedMeal.fiberG}g</strong>
            </div>
          </div>

          {/* ปุ่มบันทึกเป็นมื้อเช้า */}
          <button
            onClick={handleSelectThisMeal}
            disabled={isSaved}
            className={`mt-4 w-full rounded-2xl py-2.5 text-xs font-bold shadow transition flex items-center justify-center space-x-1.5 ${
              isSaved
                ? "bg-emerald-600 text-white"
                : "bg-purple-600 text-white hover:bg-purple-700 active:scale-95"
            }`}
          >
            {isSaved ? (
              <>
                <Check className="h-4 w-4" />
                <span>บันทึกเป็นมื้อเช้าวันนี้แล้ว!</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>บันทึกเป็นมื้อเช้าของฉันวันนี้</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
