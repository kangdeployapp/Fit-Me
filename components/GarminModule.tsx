"use client";

import React, { useState } from "react";
import { Watch, RefreshCw, Footprints, BatteryCharging, CheckCircle, AlertTriangle } from "lucide-react";

export function GarminModule() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("เมื่อ 15 นาทีที่แล้ว");
  const [todaySteps, setTodaySteps] = useState<number>(6420);
  const [weeklyAccumulated, setWeeklyAccumulated] = useState<number>(45800);

  const deviceName = "Garmin Forerunner 265";
  const batteryLevel = "84%";
  const dailyTarget = 10000;
  const weeklyTarget = 70000; // 10,000 steps x 7 days

  // คำนวณ Weekly Step Deficit (ก้าวที่ยังขาดจากเป้าหมายประจำสัปดาห์)
  const currentTotal = weeklyAccumulated + (todaySteps - 6420);
  const weeklyDeficit = Math.max(0, weeklyTarget - currentTotal);
  const weeklyProgress = Math.min(100, Math.round((currentTotal / weeklyTarget) * 100));

  const handleSyncGarmin = async () => {
    setIsSyncing(true);
    // จำลอง Garmin Connect Health API Handshake
    setTimeout(() => {
      const addedSteps = Math.floor(Math.random() * 400) + 150;
      setTodaySteps((prev) => prev + addedSteps);
      setLastSyncTime("เพิ่งซิงค์เมื่อสักครู่");
      setIsSyncing(false);
    }, 1200);
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Watch className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Garmin Connect™</h3>
            <p className="text-xs text-gray-500">{deviceName}</p>
          </div>
        </div>

        <button
          onClick={handleSyncGarmin}
          disabled={isSyncing}
          className="inline-flex items-center space-x-1 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 active:scale-95 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "กำลังซิงค์..." : "ซิงค์ด่วน"}</span>
        </button>
      </div>

      {/* Device Status Bar */}
      <div className="mt-3.5 flex items-center justify-between rounded-xl bg-gray-50/70 px-3 py-2 text-[11px] text-gray-500 border border-gray-100">
        <div className="flex items-center space-x-1.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-gray-700">เชื่อมต่อแล้ว</span>
          <span>• {lastSyncTime}</span>
        </div>
        <div className="flex items-center space-x-1 font-medium text-gray-600">
          <BatteryCharging className="h-3.5 w-3.5 text-emerald-600" />
          <span>แบตเตอรี่ {batteryLevel}</span>
        </div>
      </div>

      {/* Steps Highlight */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Today Steps */}
        <div className="rounded-2xl bg-purple-50/40 p-3.5 border border-purple-100/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-purple-900">ก้าวเดินวันนี้</span>
            <Footprints className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              {todaySteps.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">/ 10,000</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-600 transition-all duration-500"
              style={{ width: `${Math.min(100, (todaySteps / dailyTarget) * 100)}%` }}
            />
          </div>
        </div>

        {/* Weekly Step Deficit */}
        <div className="rounded-2xl bg-amber-50/40 p-3.5 border border-amber-100/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-amber-900">ขาดอีก (สัปดาห์นี้)</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-bold tracking-tight text-amber-700">
              {weeklyDeficit.toLocaleString()}
            </span>
            <span className="text-xs text-amber-600 font-medium">ก้าว</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-amber-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] text-gray-400">
        เป้าหมายประจำสัปดาห์ 70,000 ก้าว • บรรลุแล้ว {weeklyProgress}%
      </p>
    </div>
  );
}
