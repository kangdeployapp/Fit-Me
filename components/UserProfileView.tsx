"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Scale,
  Target,
  Flame,
  Droplets,
  Footprints,
  Sparkles,
  Save,
  CheckCircle2,
  Activity,
  HeartPulse,
} from "lucide-react";
import { UserProfile, Gender, ActivityLevel } from "@/types";
import { calculateBMI, calculateEnergyMetrics } from "@/lib/utils";
import { DEFAULT_USER_PROFILE, supabase } from "@/lib/supabase";

interface UserProfileViewProps {
  onProfileUpdated?: (updated: UserProfile) => void;
}

export function UserProfileView({ onProfileUpdated }: UserProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // โหลดโปรไฟล์จาก localStorage หรือ Supabase
  useEffect(() => {
    const local = localStorage.getItem("fitlife_user_profile");
    if (local) {
      try {
        setProfile(JSON.parse(local));
      } catch (e) {
        console.error("Local profile parse error", e);
      }
    }

    // ลองดึงจาก Supabase
    const fetchFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          const loaded: UserProfile = {
            id: data.id,
            nickname: data.nickname || DEFAULT_USER_PROFILE.nickname,
            gender: data.gender || "male",
            age: data.age || 39,
            heightCm: Number(data.height_cm) || 170,
            currentWeightKg: Number(data.current_weight_kg) || 83.0,
            targetWeightKg: Number(data.target_weight_kg) || 75.0,
            activityLevel: data.activity_level || "moderate",
            dailyKcalTarget: data.daily_kcal_target || 1650,
            dailyWaterMl: data.daily_water_ml || 2500,
            dailyStepGoal: data.daily_step_goal || 10000,
          };
          setProfile(loaded);
          localStorage.setItem("fitlife_user_profile", JSON.stringify(loaded));
        }
      } catch (err) {
        // ใช้ local fallback เงียบๆ
      }
    };

    fetchFromSupabase();
  }, []);

  const bmiInfo = calculateBMI(profile.currentWeightKg, profile.heightCm);
  const energy = calculateEnergyMetrics(profile);
  const weightToLose = Math.max(0, profile.currentWeightKg - profile.targetWeightKg).toFixed(1);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    // ปรับ Kcal target อัตโนมัติตาม BMR/TDEE ถ้ายังเป็นค่าเริ่มต้น
    const updated: UserProfile = {
      ...profile,
      dailyKcalTarget: energy.weightLossKcal,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem("fitlife_user_profile", JSON.stringify(updated));
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated(updated);

    try {
      await supabase.from("user_profiles").upsert(
        {
          id: profile.id || undefined,
          nickname: updated.nickname,
          gender: updated.gender,
          age: updated.age,
          height_cm: updated.heightCm,
          current_weight_kg: updated.currentWeightKg,
          target_weight_kg: updated.targetWeightKg,
          activity_level: updated.activityLevel,
          daily_kcal_target: updated.dailyKcalTarget,
          daily_water_ml: updated.dailyWaterMl,
          daily_step_goal: updated.dailyStepGoal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (err) {
      console.warn("Supabase profile save fallback:", err);
    } finally {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-4">
      {/* การ์ดสรุปข้อมูลชีวภาพ (Body Metrics Hero Card) */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-5 text-white shadow-ios">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-xl font-bold">
              {profile.nickname ? profile.nickname[0].toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-lg font-bold">{profile.nickname}</h2>
              <p className="text-xs text-blue-100">
                {profile.gender === "male" ? "ชาย" : "หญิง"} • อายุ {profile.age} ปี • สูง {profile.heightCm} ซม.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold">
            {bmiInfo.category.split(" ")[0]}
          </span>
        </div>

        {/* 4 คอลัมน์สรุปตัวชี้วัดสุขภาพ */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3">
            <div className="flex items-center space-x-1 text-xs text-blue-200">
              <Scale className="h-3.5 w-3.5" />
              <span>น้ำหนักปัจจุบัน</span>
            </div>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="text-xl font-black">{profile.currentWeightKg}</span>
              <span className="text-xs text-blue-200">กก.</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3">
            <div className="flex items-center space-x-1 text-xs text-emerald-200">
              <Target className="h-3.5 w-3.5" />
              <span>เป้าหมาย</span>
            </div>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="text-xl font-black">{profile.targetWeightKg}</span>
              <span className="text-xs text-emerald-200">กก.</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3">
            <div className="flex items-center space-x-1 text-xs text-amber-200">
              <Flame className="h-3.5 w-3.5" />
              <span>เป้าแคลอรี่/วัน</span>
            </div>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="text-xl font-black">{energy.weightLossKcal}</span>
              <span className="text-xs text-amber-200">kcal</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-3">
            <div className="flex items-center space-x-1 text-xs text-cyan-200">
              <Droplets className="h-3.5 w-3.5" />
              <span>เป้าน้ำดื่ม/วัน</span>
            </div>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="text-xl font-black">{(profile.dailyWaterMl / 1000).toFixed(1)}</span>
              <span className="text-xs text-cyan-200">ลิตร</span>
            </div>
          </div>
        </div>

        {/* BMR & TDEE Explanation bar */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-black/15 p-2.5 text-[11px] text-blue-100">
          <div className="flex items-center space-x-1.5">
            <HeartPulse className="h-3.5 w-3.5 text-pink-300" />
            <span>เผาผลาญพื้นฐาน (BMR): <strong>{energy.bmr}</strong> kcal</span>
          </div>
          <div>
            <span>เผาผลาญทั้งวัน (TDEE): <strong>{energy.tdee}</strong> kcal</span>
          </div>
        </div>
      </div>

      {/* ฟอร์มแก้ไขข้อมูลส่วนตัว */}
      <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <User className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900">แก้ไขข้อมูลพื้นฐานของคุณ</h3>
          </div>
          {savedSuccess && (
            <span className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 animate-fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>บันทึกสำเร็จ</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          {/* ชื่อเล่น และ เพศ */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">ชื่อเล่น / ชื่อเรียก</label>
              <input
                type="text"
                value={profile.nickname}
                onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                required
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">เพศสภาพ</label>
              <div className="mt-1 flex rounded-2xl bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, gender: "male" })}
                  className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition ${
                    profile.gender === "male"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  ชาย
                </button>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, gender: "female" })}
                  className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition ${
                    profile.gender === "female"
                      ? "bg-white text-pink-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  หญิง
                </button>
              </div>
            </div>
          </div>

          {/* อายุ, ส่วนสูง */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">อายุ (ปี)</label>
              <input
                type="number"
                min="10"
                max="100"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">ส่วนสูง (ซม.)</label>
              <input
                type="number"
                min="100"
                max="230"
                value={profile.heightCm}
                onChange={(e) => setProfile({ ...profile, heightCm: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* น้ำหนักปัจจุบัน และ เป้าหมาย */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">น้ำหนักปัจจุบัน (กก.)</label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="250"
                value={profile.currentWeightKg}
                onChange={(e) => setProfile({ ...profile, currentWeightKg: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">น้ำหนักเป้าหมาย (กก.)</label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="250"
                value={profile.targetWeightKg}
                onChange={(e) => setProfile({ ...profile, targetWeightKg: parseFloat(e.target.value) || 0 })}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* ระดับกิจกรรมประจำวัน */}
          <div>
            <label className="text-xs font-semibold text-gray-600">ระดับกิจกรรมประจำวัน (Activity Level)</label>
            <select
              value={profile.activityLevel}
              onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })}
              className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-medium text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="sedentary">ไม่ออกกำลังกายเลย / นั่งทำงานหน้าคอมพ์ทั้งวัน</option>
              <option value="light">ออกกำลังกายเบาๆ (1-3 วัน/สัปดาห์)</option>
              <option value="moderate">ออกกำลังกายปานกลาง (3-5 วัน/สัปดาห์)</option>
              <option value="active">ออกกำลังกายหนัก (6-7 วัน/สัปดาห์)</option>
              <option value="very_active">ออกกำลังกายหนักมาก / นักกีฬาอาชีพ</option>
            </select>
          </div>

          {/* เป้าหมายน้ำดื่ม และ ก้าวเดินต่อวัน */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-gray-600">เป้าน้ำดื่มรายวัน (มล.)</label>
              <input
                type="number"
                step="100"
                value={profile.dailyWaterMl}
                onChange={(e) => setProfile({ ...profile, dailyWaterMl: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600">เป้าก้าวเดินรายวัน (ก้าว)</label>
              <input
                type="number"
                step="500"
                value={profile.dailyStepGoal}
                onChange={(e) => setProfile({ ...profile, dailyStepGoal: Number(e.target.value) })}
                className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* ปุ่มบันทึก */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 active:scale-95 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "กำลังบันทึกข้อมูล..." : "บันทึกข้อมูลส่วนตัว"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
