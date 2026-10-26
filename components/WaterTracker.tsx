"use client";

import React, { useState } from "react";
import { Droplets, Plus, Minus, RotateCcw, CheckCircle2 } from "lucide-react";

export function WaterTracker() {
  const [waterMl, setWaterMl] = useState<number>(1500);
  const targetMl = 2500;

  const percentage = Math.min(100, Math.round((waterMl / targetMl) * 100));
  const remainingMl = Math.max(0, targetMl - waterMl);

  const addWater = (amount: number) => {
    setWaterMl((prev) => Math.min(5000, prev + amount));
  };

  const removeWater = (amount: number) => {
    setWaterMl((prev) => Math.max(0, prev - amount));
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">บันทึกการดื่มน้ำ</h3>
            <p className="text-xs text-gray-500">
              {remainingMl > 0
                ? `ดื่มอีก ${remainingMl.toLocaleString()} มล. เพื่อให้ถึงเป้าหมาย`
                : "ยินดีด้วย! ดื่มน้ำครบตามเป้าหมายแล้ว 🎉"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setWaterMl(0)}
          className="text-gray-400 hover:text-gray-600 p-1"
          title="รีเซ็ต"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center space-x-5">
        {/* Visual Glass Indicator */}
        <div className="relative h-32 w-20 flex-shrink-0 rounded-2xl border-2 border-cyan-200 bg-cyan-50/40 p-1.5 shadow-inner overflow-hidden flex flex-col justify-end">
          {/* Water Fill with gradient */}
          <div
            className="w-full rounded-xl bg-gradient-to-t from-cyan-600 via-cyan-500 to-sky-400 transition-all duration-500 ease-out flex items-center justify-center relative overflow-hidden"
            style={{ height: `${percentage}%` }}
          >
            {/* Subtle wave shine */}
            <div className="absolute inset-x-0 top-0 h-2 bg-white/30 rounded-full blur-[1px]"></div>
          </div>
          {/* Glass Marks */}
          <div className="absolute inset-y-2 right-1.5 flex flex-col justify-between py-2 text-[8px] text-cyan-400 font-mono select-none">
            <span>2.5L</span>
            <span>1.8L</span>
            <span>1.0L</span>
            <span>0.2L</span>
          </div>
        </div>

        {/* Stats & Progress */}
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {waterMl.toLocaleString()}
              </span>
              <span className="ml-1 text-xs text-gray-500">/ {targetMl.toLocaleString()} มล.</span>
            </div>
            <span className="text-sm font-bold text-cyan-600">{percentage}%</span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Quick Add Buttons */}
          <div className="mt-3.5 flex items-center space-x-2">
            <button
              onClick={() => addWater(250)}
              className="flex-1 rounded-xl bg-cyan-500 py-2 px-2 text-xs font-semibold text-white shadow-sm hover:bg-cyan-600 active:scale-95 transition flex items-center justify-center space-x-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+250 มล. (1 แก้ว)</span>
            </button>
            <button
              onClick={() => addWater(500)}
              className="flex-1 rounded-xl bg-blue-600 py-2 px-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition flex items-center justify-center space-x-1"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+500 มล. (1 ขวด)</span>
            </button>
            {waterMl > 0 && (
              <button
                onClick={() => removeWater(250)}
                className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-gray-500 hover:bg-gray-100 active:scale-95 transition"
                title="ลด 250 มล."
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
