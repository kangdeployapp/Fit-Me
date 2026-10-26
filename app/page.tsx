"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  User,
  X,
  Droplets,
  Utensils,
  Footprints,
  Scale,
  LayoutDashboard,
} from "lucide-react";
import { BottomNav, NavCategory } from "@/components/BottomNav";
import { DashboardView } from "@/components/views/DashboardView";
import { WaterView } from "@/components/views/WaterView";
import { BreakfastDirectory } from "@/components/BreakfastDirectory";
import { StepsView } from "@/components/views/StepsView";
import { WeightView } from "@/components/views/WeightView";
import { UserProfileView } from "@/components/UserProfileView";
import { UserProfile, BreakfastMeal } from "@/types";
import { DEFAULT_USER_PROFILE } from "@/lib/supabase";

export default function App() {
  const [activeCategory, setActiveCategory] = useState<NavCategory>("dashboard");
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [currentBreakfast, setCurrentBreakfast] = useState<BreakfastMeal | null>(null);
  const [waterMl, setWaterMl] = useState<number>(1500);
  const [todaySteps, setTodaySteps] = useState<number>(6420);
  const [currentWeight, setCurrentWeight] = useState<number>(73.0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // โหลดค่าแคชจาก localStorage
  useEffect(() => {
    const prof = localStorage.getItem("fitlife_user_profile");
    if (prof) {
      try {
        const parsed = JSON.parse(prof);
        setUserProfile(parsed);
        if (parsed.currentWeightKg) setCurrentWeight(parsed.currentWeightKg);
      } catch (e) {}
    }

    const bf = localStorage.getItem("fitlife_today_breakfast");
    if (bf) {
      try {
        setCurrentBreakfast(JSON.parse(bf));
      } catch (e) {}
    }

    const savedWater = localStorage.getItem("fitlife_today_water");
    if (savedWater) {
      setWaterMl(Number(savedWater) || 1500);
    }
  }, []);

  const handleWaterChange = (amount: number) => {
    setWaterMl(amount);
    localStorage.setItem("fitlife_today_water", String(amount));
  };

  const todayDateString = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const categoryTitles: Record<NavCategory, { title: string; subtitle: string }> = {
    dashboard: { title: "ภาพรวมสุขภาพ", subtitle: "สรุปความคืบหน้ารวมประจำวัน" },
    water: { title: "การดื่มน้ำ", subtitle: "เติมความสดชื่นและกระตุ้นการเผาผลาญ" },
    breakfast: { title: "เมนูอาหารเช้า", subtitle: "เลือกทานมื้อเช้าสุขภาพดีตามเป้าหมาย" },
    steps: { title: "ก้าวเดิน & ออกกำลัง", subtitle: "ซิงค์ Garmin และตัวจับเวลาเดิน" },
    weight: { title: "น้ำหนัก & BMI", subtitle: "บันทึกและติดตามแนวโน้มสู่เป้าหมาย" },
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[#F2F2F7] pb-24 text-gray-900">
      {/* iOS Translucent Blur Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-gray-200/60 px-5 pt-safe pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-600">
              <Sparkles className="h-3 w-3" />
              <span>FitLife Tracker</span>
              <span>•</span>
              <span className="text-gray-400 font-normal">{todayDateString}</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">
              {categoryTitles[activeCategory].title}
            </h1>
          </div>

          {/* ปุ่มโปรไฟล์ผู้ใช้ */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center space-x-2 rounded-full bg-gray-100 p-1 pr-3 hover:bg-gray-200 active:scale-95 transition"
            title="จัดการโปรไฟล์ส่วนตัว & เป้าหมาย"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
              {userProfile.nickname ? userProfile.nickname[0].toUpperCase() : "U"}
            </span>
            <span className="text-xs font-semibold text-gray-700 max-w-[80px] truncate">
              {userProfile.nickname}
            </span>
          </button>
        </div>
      </header>

      {/* Main Category Content */}
      <main className="p-4">
        {/* 1. หมวด Dashboard */}
        {activeCategory === "dashboard" && (
          <DashboardView
            userProfile={userProfile}
            currentBreakfast={currentBreakfast}
            waterMl={waterMl}
            todaySteps={todaySteps}
            currentWeight={currentWeight}
            onChangeCategory={(cat) => setActiveCategory(cat)}
          />
        )}

        {/* 2. หมวด การดื่มน้ำ */}
        {activeCategory === "water" && (
          <WaterView
            userProfile={userProfile}
            waterMl={waterMl}
            onWaterChange={handleWaterChange}
          />
        )}

        {/* 3. หมวด อาหารเช้า */}
        {activeCategory === "breakfast" && (
          <BreakfastDirectory
            onMealSelected={(meal) => setCurrentBreakfast(meal)}
          />
        )}

        {/* 4. หมวด ก้าวเดิน */}
        {activeCategory === "steps" && (
          <StepsView userProfile={userProfile} />
        )}

        {/* 5. หมวด น้ำหนัก */}
        {activeCategory === "weight" && (
          <WeightView userProfile={userProfile} />
        )}
      </main>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">ข้อมูลส่วนตัว & การเผาผลาญ</h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
              <UserProfileView
                onProfileUpdated={(updated) => {
                  setUserProfile(updated);
                  if (updated.currentWeightKg) setCurrentWeight(updated.currentWeightKg);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* iOS Floating Bottom Bar Navigation */}
      <BottomNav
        activeCategory={activeCategory}
        onChangeCategory={(cat) => setActiveCategory(cat)}
      />
    </div>
  );
}
