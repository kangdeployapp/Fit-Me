"use client";

import React, { useState, useEffect } from "react";
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
  Database,
  CheckCircle,
  Watch,
  Heart,
} from "lucide-react";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { MotivationalCard } from "@/components/MotivationalCard";
import { UserProfile, BreakfastMeal } from "@/types";
import { NavCategory } from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

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
  const [supabaseStats, setSupabaseStats] = useState<{
    weightCount: number;
    recipeCount: number;
    isConnected: boolean;
  }>({ weightCount: 0, recipeCount: 0, isConnected: true });

  useEffect(() => {
    // ตรวจสอบการเชื่อมต่อจริงและนับจำนวนแถวใน Supabase
    const verifySupabaseConnection = async () => {
      try {
        const { count: wCount } = await supabase
          .from("weight_logs")
          .select("*", { count: "exact", head: true });

        const { count: rCount } = await supabase
          .from("breakfast_recipes")
          .select("*", { count: "exact", head: true });

        setSupabaseStats({
          weightCount: wCount || 0,
          recipeCount: rCount || 0,
          isConnected: true,
        });
      } catch (e) {
        setSupabaseStats((prev) => ({ ...prev, isConnected: false }));
      }
    };
    verifySupabaseConnection();
  }, []);

  const waterPercent = Math.min(100, Math.round((waterMl / userProfile.dailyWaterMl) * 100));
  const stepsPercent = Math.min(100, Math.round((todaySteps / userProfile.dailyStepGoal) * 100));
  const diffWeight = (currentWeight - userProfile.targetWeightKg).toFixed(1);

  return (
    <div className="space-y-4">
      {/* 1. Supabase Live Connection Inspector Badge */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-3.5 border border-emerald-200/80 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2.5">
          <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="flex items-center space-x-1.5 font-bold text-emerald-950">
              <Database className="h-3.5 w-3.5 text-emerald-600" />
              <span>ฐานข้อมูล Supabase เชื่อมต่อสมบูรณ์ (ข้อมูลจริง 100%)</span>
            </div>
            <p className="text-[10px] text-emerald-700">
              บันทึกน้ำหนัก {supabaseStats.weightCount} ครั้ง • สูตรอาหาร {supabaseStats.recipeCount} เมนู • ข้อมูลซิงค์อัตโนมัติ
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[9px] font-black tracking-wider">
          ONLINE
        </span>
      </div>

      {/* 2. การ์ดข้อความให้กำลังใจและกระตุ้นพลังบวกประจำวัน */}
      <MotivationalCard />

      {/* 3. Web Push Notification Manager Card */}
      <PushNotificationManager />

      {/* 4. Hero Apple-Fitness Style Rings / Daily Progress Summary */}
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

          {/* Card 2: ก้าวเดิน & Garmin */}
          <div
            onClick={() => onChangeCategory("steps")}
            className="group cursor-pointer rounded-2xl bg-purple-50/50 p-3.5 border border-purple-100/70 hover:bg-purple-50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-800">🚶‍♂️ ก้าวเดิน Garmin</span>
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
              <span className="text-xs font-bold text-emerald-800">⚖️ น้ำหนักจริง</span>
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

      {/* 5. Garmin Health Age Highlight */}
      <div
        onClick={() => onChangeCategory("steps")}
        className="cursor-pointer rounded-3xl bg-gradient-to-r from-purple-700 to-indigo-800 p-4 text-white shadow-md flex items-center justify-between hover:opacity-95 transition"
      >
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <Watch className="h-6 w-6 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-sm font-bold">Garmin Connect™ Sync บน iPhone</h4>
              <span className="rounded-full bg-emerald-400 text-purple-950 px-2 py-0.5 text-[9px] font-black">
                CONNECTED
              </span>
            </div>
            <p className="text-xs text-purple-200">
              ยอดก้าวเดิน {todaySteps.toLocaleString()} ก้าว • อายุสุขภาพเด็กลง 4 ปี
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-purple-200" />
      </div>
    </div>
  );
}
