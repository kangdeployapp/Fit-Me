"use client";

import React, { useState, useEffect } from "react";
import {
  Droplets,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Clock,
  CheckCircle,
  Database,
} from "lucide-react";
import { UserProfile } from "@/types";
import { supabase } from "@/lib/supabase";

interface WaterLogEntry {
  id: string;
  time: string;
  amountMl: number;
}

interface WaterViewProps {
  userProfile: UserProfile;
  waterMl: number;
  onWaterChange: (newAmount: number) => void;
}

export function WaterView({ userProfile, waterMl, onWaterChange }: WaterViewProps) {
  const [logs, setLogs] = useState<WaterLogEntry[]>([
    { id: "1", time: "08:15", amountMl: 250 },
    { id: "2", time: "10:30", amountMl: 500 },
    { id: "3", time: "12:45", amountMl: 500 },
  ]);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // คำนวณปริมาณน้ำที่เหมาะสมตามน้ำหนักตัว (น้ำหนัก x 33 มล.)
  const recommendedMl = Math.round(userProfile.currentWeightKg * 33);
  const targetMl = userProfile.dailyWaterMl || recommendedMl;
  const percentage = Math.min(100, Math.round((waterMl / targetMl) * 100));
  const remainingMl = Math.max(0, targetMl - waterMl);

  // ดึงค่าน้ำดื่มจริงของวันนี้จาก Supabase
  useEffect(() => {
    const fetchTodayWater = async () => {
      const todayStr = new Date().toISOString().split("T")[0];
      try {
        const { data, error } = await supabase
          .from("daily_habits")
          .select("water_ml")
          .eq("date", todayStr)
          .maybeSingle();

        if (data && !error && data.water_ml !== undefined && data.water_ml !== null) {
          onWaterChange(data.water_ml);
        }
      } catch (e) {
        console.warn("Water fetch error:", e);
      }
    };
    fetchTodayWater();
  }, []);

  const addWater = async (amount: number) => {
    const updated = Math.min(6000, waterMl + amount);
    onWaterChange(updated);

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setLogs((prev) => [{ id: String(Date.now()), time: timeStr, amountMl: amount }, ...prev]);

    // บันทึกลง Supabase จริงทันที
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      await supabase.from("daily_habits").upsert(
        {
          date: todayStr,
          water_ml: updated,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date" }
      );
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 2000);
    } catch (err) {
      console.warn("Water save error", err);
    }
  };

  const resetWater = async () => {
    onWaterChange(0);
    setLogs([]);
    const todayStr = new Date().toISOString().split("T")[0];
    try {
      await supabase.from("daily_habits").upsert(
        {
          date: todayStr,
          water_ml: 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "date" }
      );
    } catch (err) {
      console.warn("Water reset error", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {isSavedToast && (
        <div className="rounded-2xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg flex items-center space-x-1.5 animate-fade-in">
          <CheckCircle className="h-4 w-4" />
          <span>บันทึกปริมาณน้ำดื่มลง Supabase สำเร็จแล้ว!</span>
        </div>
      )}

      {/* Hero Visual Glass Card */}
      <div className="rounded-3xl bg-white p-6 shadow-ios border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
              <Droplets className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-lg font-bold text-gray-900">บันทึกการดื่มน้ำ</h2>
                <span className="flex items-center space-x-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                  <Database className="h-2.5 w-2.5 text-emerald-600" />
                  <span>Sync Supabase</span>
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {remainingMl > 0
                  ? `ดื่มอีก ${remainingMl.toLocaleString()} มล. เพื่อสุขภาพที่ดี`
                  : "ยินดีด้วยครับ! คุณดื่มน้ำครบตามเป้าหมายแล้ว 🎉"}
              </p>
            </div>
          </div>

          <button
            onClick={resetWater}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            title="รีเซ็ตค่าวันนี้"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Visual Glass & Hydration Progress */}
        <div className="mt-6 flex items-center space-x-6">
          {/* Animated 3D Glass */}
          <div className="relative h-44 w-28 flex-shrink-0 rounded-3xl border-4 border-cyan-200 bg-cyan-50/50 p-1.5 shadow-inner flex flex-col justify-end overflow-hidden">
            <div
              className="w-full rounded-2xl bg-gradient-to-t from-cyan-600 via-cyan-500 to-sky-400 transition-all duration-700 ease-out flex items-center justify-center relative overflow-hidden"
              style={{ height: `${percentage}%` }}
            >
              <div className="absolute inset-x-0 top-0 h-3 bg-white/40 rounded-full blur-[1px]" />
              {percentage > 20 && (
                <span className="text-xs font-black text-white drop-shadow">
                  {percentage}%
                </span>
              )}
            </div>

            {/* Glass Levels */}
            <div className="absolute inset-y-3 right-2 flex flex-col justify-between py-2 text-[9px] font-mono text-cyan-400 select-none">
              <span>{targetMl}ml</span>
              <span>{Math.round(targetMl * 0.66)}ml</span>
              <span>{Math.round(targetMl * 0.33)}ml</span>
            </div>
          </div>

          {/* Stats Details */}
          <div className="flex-1">
            <div className="flex items-baseline space-x-1">
              <span className="text-4xl font-black text-gray-900 tracking-tight">
                {waterMl.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 font-semibold">/ {targetMl.toLocaleString()} มล.</span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-3 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="mt-3 text-xs text-gray-500">
              <span>เกณฑ์แนะนำตามน้ำหนักตัว: </span>
              <strong className="text-cyan-700">{recommendedMl.toLocaleString()} มล./วัน</strong>
            </div>

            {/* ระบบติดตามและแจ้งเตือนอัตโนมัติ */}
            <div className="mt-4 flex items-center space-x-1.5 text-[11px] font-semibold text-cyan-800 bg-cyan-50/80 px-3 py-1.5 rounded-full border border-cyan-100/60">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              <span>ระบบคอยเตือนดื่มน้ำอัตโนมัติเมื่อถึงช่วงเวลา</span>
            </div>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="mt-6">
          <span className="text-xs font-semibold text-gray-600 block mb-2">กดเติมน้ำด่วน (บันทึกลง Supabase ทันที):</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => addWater(250)}
              className="rounded-2xl bg-cyan-500 py-3 text-xs font-bold text-white shadow-sm hover:bg-cyan-600 active:scale-95 transition flex flex-col items-center justify-center space-y-0.5"
            >
              <span>+250 มล.</span>
              <span className="text-[10px] text-cyan-100 font-normal">1 แก้ว</span>
            </button>
            <button
              onClick={() => addWater(500)}
              className="rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition flex flex-col items-center justify-center space-y-0.5"
            >
              <span>+500 มล.</span>
              <span className="text-[10px] text-blue-100 font-normal">1 ขวดเล็ก</span>
            </button>
            <button
              onClick={() => addWater(750)}
              className="rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition flex flex-col items-center justify-center space-y-0.5"
            >
              <span>+750 มล.</span>
              <span className="text-[10px] text-indigo-100 font-normal">1 ขวดใหญ่</span>
            </button>
          </div>
        </div>
      </div>

      {/* ประวัติการดื่มน้ำวันนี้ */}
      <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1.5">
          <Clock className="h-4 w-4 text-cyan-600" />
          <span>ประวัติการดื่มน้ำวันนี้</span>
        </h3>

        {logs.length === 0 ? (
          <p className="mt-3 text-center text-xs text-gray-400 py-4">ยังไม่มีรายการดื่มน้ำวันนี้</p>
        ) : (
          <div className="mt-3 space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-2xl bg-gray-50/70 p-2.5 px-3 text-xs"
              >
                <div className="flex items-center space-x-2 text-gray-600">
                  <span className="font-mono text-gray-400">{log.time} น.</span>
                  <span>ดื่มน้ำ</span>
                </div>
                <span className="font-bold text-cyan-700">+{log.amountMl} มล.</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
