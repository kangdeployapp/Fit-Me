"use client";

import React, { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, Volume2, Footprints, Flame } from "lucide-react";
import { playChimeSound } from "@/lib/utils";

export function WalkTimer() {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(15 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [walkingSteps, setWalkingSteps] = useState<number>(0);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);

  const totalDuration = selectedMinutes * 60;
  const progressPercent = Math.round(((totalDuration - timeLeftSeconds) / totalDuration) * 100);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // เลือกระยะเวลาถอยหลัง 15, 30, 45 นาที
  const handleSelectPreset = (minutes: number) => {
    setIsActive(false);
    setSelectedMinutes(minutes);
    setTimeLeftSeconds(minutes * 60);
    setWalkingSteps(0);
    setCaloriesBurned(0);
  };

  const handleToggleTimer = () => {
    setIsActive((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsActive(false);
    setTimeLeftSeconds(selectedMinutes * 60);
    setWalkingSteps(0);
    setCaloriesBurned(0);
  };

  // Timer Tick
  useEffect(() => {
    if (isActive && timeLeftSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsActive(false);
            onTimerComplete();
            return 0;
          }
          return prev - 1;
        });

        // คำนวณก้าวสะสมเฉลี่ย (ประมาณ 1.9 ก้าวต่อวินาที = ~114 ก้าว/นาที)
        setWalkingSteps((prev) => prev + 2);
        // คำนวณแคลอรี่ที่เผาผลาญ (ประมาณ 0.08 kcal / วินาที = ~4.8 kcal/นาที)
        setCaloriesBurned((prev) => Number((prev + 0.08).toFixed(1)));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeftSeconds]);

  // เมื่อหมดเวลา
  const onTimerComplete = async () => {
    // 1. เล่นเสียงระฆัง Chime Web Audio API
    playChimeSound();

    // 2. ขอยิง Push Notification หรือ Service Worker Local Notification
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg) {
          reg.showNotification("🎉 ครบกำหนดเวลาเดินแล้ว!", {
            body: `ยอดเยี่ยมมาก! คุณเดินได้สะสม ${walkingSteps} ก้าว เผาผลาญไป ${caloriesBurned} kcal`,
            icon: "/icons/icon-192.png",
          });
        }
      }
      // เรียก send-push backend เพื่อยืนยัน push
      fetch("/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "walk_done" }),
      }).catch(() => {});
    } catch (e) {
      console.warn("Notification trigger failed", e);
    }
  };

  // จัดรูปแบบเวลา MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">ตัวจับเวลาเดินถอยหลัง</h3>
            <p className="text-xs text-gray-500">พร้อมสะสมก้าวเดินและเสียง Chime แจ้งเตือน</p>
          </div>
        </div>

        <button
          onClick={playChimeSound}
          className="rounded-full bg-gray-100 p-2 text-gray-500 hover:text-gray-800 transition"
          title="ทดสอบเสียงกระดิ่ง Chime"
        >
          <Volume2 className="h-4 w-4" />
        </button>
      </div>

      {/* ปุ่มเลือกระยะเวลาถอยหลัง Preset */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[15, 30, 45].map((mins) => (
          <button
            key={mins}
            onClick={() => handleSelectPreset(mins)}
            className={`rounded-2xl py-2 text-xs font-semibold transition ${
              selectedMinutes === mins
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/60"
            }`}
          >
            {mins} นาที
          </button>
        ))}
      </div>

      {/* หน้าปัดดิจิทัลขนาดใหญ่ */}
      <div className="mt-5 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 py-6 text-white shadow-inner relative overflow-hidden">
        {/* Progress Background bar */}
        <div
          className="absolute bottom-0 left-0 top-0 bg-emerald-500/15 transition-all duration-1000"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="z-10 text-center">
          <div className="font-mono text-5xl font-black tracking-tight drop-shadow-md">
            {formatTime(timeLeftSeconds)}
          </div>
          <span className="mt-1 inline-block text-[11px] font-medium text-emerald-400">
            {isActive ? "กำลังเดิน..." : timeLeftSeconds === 0 ? "เดินเสร็จสิ้นแล้ว 🎉" : "พร้อมเริ่มเดิน"}
          </span>
        </div>

        {/* ก้าวเดิน & แคลอรี่ที่สะสมระหว่างจับเวลา */}
        <div className="z-10 mt-4 flex items-center space-x-6 border-t border-gray-700/60 pt-3 text-xs">
          <div className="flex items-center space-x-1.5 text-gray-300">
            <Footprints className="h-4 w-4 text-emerald-400" />
            <span>
              สะสม <strong className="text-white">{walkingSteps}</strong> ก้าว
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-gray-300">
            <Flame className="h-4 w-4 text-orange-400" />
            <span>
              เผาผลาญ <strong className="text-white">{Math.round(caloriesBurned)}</strong> kcal
            </span>
          </div>
        </div>
      </div>

      {/* ปุ่มควบคุม เริ่ม/หยุด/รีเซ็ต */}
      <div className="mt-4 flex items-center space-x-3">
        <button
          onClick={handleToggleTimer}
          className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white shadow-lg active:scale-95 transition flex items-center justify-center space-x-2 ${
            isActive
              ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
          }`}
        >
          {isActive ? (
            <>
              <Pause className="h-4 w-4" />
              <span>หยุดชั่วคราว</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white" />
              <span>{timeLeftSeconds === totalDuration ? "เริ่มเดินทันที" : "เดินต่อ"}</span>
            </>
          )}
        </button>

        <button
          onClick={handleResetTimer}
          className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-gray-600 hover:bg-gray-100 active:scale-95 transition"
          title="รีเซ็ตเวลา"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
