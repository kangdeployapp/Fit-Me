"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Flame,
  Utensils,
  User,
} from "lucide-react";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import { WeightTracker } from "@/components/WeightTracker";
import { WaterTracker } from "@/components/WaterTracker";
import { GarminModule } from "@/components/GarminModule";
import { WalkTimer } from "@/components/WalkTimer";
import { BreakfastDirectory } from "@/components/BreakfastDirectory";
import { UserProfileView } from "@/components/UserProfileView";
import { BottomNav, NavTab } from "@/components/BottomNav";
import { UserProfile, BreakfastMeal } from "@/types";
import { DEFAULT_USER_PROFILE } from "@/lib/supabase";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [currentBreakfast, setCurrentBreakfast] = useState<BreakfastMeal | null>(null);

  useEffect(() => {
    const localProf = localStorage.getItem("fitlife_user_profile");
    if (localProf) {
      try {
        setUserProfile(JSON.parse(localProf));
      } catch (e) {}
    }

    const localBf = localStorage.getItem("fitlife_today_breakfast");
    if (localBf) {
      try {
        setCurrentBreakfast(JSON.parse(localBf));
      } catch (e) {}
    }
  }, []);

  const todayDateString = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-[#F2F2F7] pb-28 text-gray-900">
      {/* iOS Translucent Blur Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-gray-200/60 px-5 pt-safe pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">
              <Sparkles className="h-3.5 w-3.5" />
              <span>FitLife Tracker</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">
              {activeTab === "overview" && "สุขภาพวันนี้"}
              {activeTab === "breakfast" && "เมนูอาหารเช้า"}
              {activeTab === "profile" && "ข้อมูลส่วนตัว & เป้าหมาย"}
            </h1>
          </div>

          {/* Avatar Shortcut to Profile Tab */}
          <button
            onClick={() => setActiveTab("profile")}
            className="flex items-center space-x-2 rounded-full bg-gray-100 p-1 pr-3 hover:bg-gray-200 active:scale-95 transition"
            title="ไปที่หน้าโปรไฟล์"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
              {userProfile.nickname ? userProfile.nickname[0].toUpperCase() : "U"}
            </span>
            <span className="text-xs font-semibold text-gray-700 max-w-[80px] truncate">
              {userProfile.nickname}
            </span>
          </button>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">{todayDateString}</p>
      </header>

      {/* Main Tab Content */}
      <main className="p-4 space-y-4">
        {/* TAB 1: OVERVIEW (หน้าหลัก) */}
        {activeTab === "overview" && (
          <>
            {/* 1. Web Push Notification Manager */}
            <section>
              <PushNotificationManager />
            </section>

            {/* 2. Garmin Connect Module & Steps */}
            <section>
              <GarminModule />
            </section>

            {/* 3. Weight Log & BMI Interactive Chart */}
            <section>
              <WeightTracker />
            </section>

            {/* 4. Quick Breakfast Card (กดแล้วสลับไป Tab เมนูอาหารเช้าได้ทันที) */}
            <section>
              <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">อาหารเช้าวันนี้</h3>
                      <p className="text-xs text-gray-500">
                        {currentBreakfast
                          ? `${currentBreakfast.name} (${currentBreakfast.kcal} kcal)`
                          : "ยังไม่ได้เลือกเมนูมื้อเช้า"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab("breakfast")}
                    className="flex items-center space-x-1 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600 hover:bg-orange-100 active:scale-95 transition"
                  >
                    <span>เลือกเมนู</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {currentBreakfast && (
                  <div className="mt-3.5 rounded-2xl bg-orange-50/60 p-3 border border-orange-100 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{currentBreakfast.icon}</span>
                      <div>
                        <span className="font-bold text-gray-900 block line-clamp-1">
                          {currentBreakfast.name}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          โปรตีน {currentBreakfast.proteinG}g • คาร์บ {currentBreakfast.carbsG}g
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-orange-600">{currentBreakfast.kcal} kcal</span>
                  </div>
                )}
              </div>
            </section>

            {/* 5. Water Intake Tracker */}
            <section>
              <WaterTracker />
            </section>

            {/* 6. Walking Countdown Timer */}
            <section>
              <WalkTimer />
            </section>
          </>
        )}

        {/* TAB 2: BREAKFAST DIRECTORY (หน้ารวมเมนูอาหารเช้าแบ่งหมวดหมู่แบบเต็ม) */}
        {activeTab === "breakfast" && (
          <section>
            <BreakfastDirectory
              onMealSelected={(meal) => setCurrentBreakfast(meal)}
            />
          </section>
        )}

        {/* TAB 3: USER PROFILE (หน้าบันทึกข้อมูลพื้นฐาน BMR & TDEE) */}
        {activeTab === "profile" && (
          <section>
            <UserProfileView
              onProfileUpdated={(updated) => setUserProfile(updated)}
            />
          </section>
        )}
      </main>

      {/* iOS Floating Bottom Tab Bar */}
      <BottomNav activeTab={activeTab} onChangeTab={(tab) => setActiveTab(tab)} />
    </div>
  );
}
