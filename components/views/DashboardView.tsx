"use client";

import React from "react";
import {
  Droplets,
  Utensils,
  Footprints,
  Scale,
  Sparkles,
  ChevronRight,
  TrendingDown,
  Activity,
  Flame,
  Award,
} from "lucide-react";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { MotivationalCard } from "@/components/MotivationalCard";
import { UserProfile, BreakfastMeal } from "@/types";
import { NavCategory } from "@/components/BottomNav";

interface DashboardViewProps {
  userProfile: UserProfile;
  currentBreakfast: BreakfastMeal | null;
  waterMl: number;
  todaySteps: number;
  currentWeight: number;
  onChangeCategory: (cat: NavCategory) => void;
}

export function DashboardView({
  userProfile,
  currentBreakfast,
  waterMl,
  todaySteps,
  currentWeight,
  onChangeCategory,
}: DashboardViewProps) {
  const waterPercent = Math.min(100, Math.round((waterMl / userProfile.dailyWaterMl) * 100));
  const stepsPercent = Math.min(100, Math.round((todaySteps / userProfile.dailyStepGoal) * 100));
  const diffWeight = (currentWeight - userProfile.targetWeightKg).toFixed(1);

  return (
    <div className="space-y-4">
      {/* 1. การ์ดข้อความให้กำลังใจและกระตุ้นพลังบวกประจำวัน */}
      <MotivationalCard />

      {/* 2. Web Push Notification Manager Card */}
      <PushNotificationManager />

      {/* 3. Hero Apple-Fitness Style Rings / Daily Progress Summary */}
      <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">สรุปความคืบหน้าวันนี้</h3>
              <p className="text-xs text-gray-500">เป้าหมายเพื่อสุขภาพและลดน้ำหนัก</p>
            </div>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {userProfile.nickname}
          </span>
        </div>

        {/* 4 Cards Summary Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Card 1: ดื่มน้ำ */}
          <div
            onClick={() => onChangeCategory("water")}
            className="group cursor-pointer rounded-2xl bg-cyan-50/50 p-3.5 border border-cyan-100/70 hover:bg-cyan-50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-800">💧 ดื่มน้ำ</span>
              <ChevronRight className="h-3.5 w-3.5 text-cyan-500 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl font-black text-gray-900">{waterMl.toLocaleString()}</span>
              <span className="text-xs text-gray-500">/ {userProfile.dailyWaterMl} มล.</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-cyan-200/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
          </div>

          {/* Card 2: ก้าวเดิน */}
          <div
            onClick={() => onChangeCategory("steps")}
            className="group cursor-pointer rounded-2xl bg-purple-50/50 p-3.5 border border-purple-100/70 hover:bg-purple-50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800">🚶‍♂️ ก้าวเดิน</span>
              <ChevronRight className="h-3.5 w-3.5 text-purple-500 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl font-black text-gray-900">{todaySteps.toLocaleString()}</span>
              <span className="text-xs text-gray-500">/ 10,000</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-purple-200/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-purple-600 transition-all duration-500"
                style={{ width: `${stepsPercent}%` }}
              />
            </div>
          </div>

          {/* Card 3: อาหารเช้า */}
          <div
            onClick={() => onChangeCategory("breakfast")}
            className="group cursor-pointer rounded-2xl bg-orange-50/50 p-3.5 border border-orange-100/70 hover:bg-orange-50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-800">🥗 อาหารเช้า</span>
              <ChevronRight className="h-3.5 w-3.5 text-orange-500 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="mt-2">
              <span className="text-xs font-bold text-gray-900 block truncate">
                {currentBreakfast ? currentBreakfast.name : "ยังไม่ได้เลือก"}
              </span>
              <span className="text-xs font-extrabold text-orange-600">
                {currentBreakfast ? `${currentBreakfast.kcal} kcal` : "แตะเพื่อเลือกเมนู"}
              </span>
            </div>
          </div>

          {/* Card 4: น้ำหนัก */}
          <div
            onClick={() => onChangeCategory("weight")}
            className="group cursor-pointer rounded-2xl bg-emerald-50/50 p-3.5 border border-emerald-100/70 hover:bg-emerald-50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">⚖️ น้ำหนัก</span>
              <ChevronRight className="h-3.5 w-3.5 text-emerald-500 group-hover:translate-x-0.5 transition" />
            </div>
            <div className="mt-2 flex items-baseline space-x-1">
              <span className="text-2xl font-black text-gray-900">{currentWeight}</span>
              <span className="text-xs text-gray-500">กก.</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 block mt-1">
              ขาดอีก {diffWeight} กก. ถึงเป้าหมาย
            </span>
          </div>
        </div>
      </div>

      {/* 4. Quick Action Callout */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-md flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold">พร้อมสำหรับการเดินเพื่อสุขภาพหรือยัง?</h4>
          <p className="text-xs text-blue-100">เปิดตัวจับเวลาเดิน 15-45 นาที เพื่อเผาผลาญไขมัน</p>
        </div>
        <button
          onClick={() => onChangeCategory("steps")}
          className="rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow hover:bg-blue-50 active:scale-95 transition flex-shrink-0"
        >
          เริ่มเดิน
        </button>
      </div>
    </div>
  );
}
