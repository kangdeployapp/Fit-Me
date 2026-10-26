"use client";

import React, { useState, useEffect } from "react";
import { Scale, TrendingDown, Plus, Sparkles, Check, History } from "lucide-react";
import { calculateBMI } from "@/lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeightEntry {
  date: string;
  weight: number;
}

export function WeightTracker() {
  const [weight, setWeight] = useState<string>("73.0");
  const [targetWeight] = useState<number>(68.0);
  const [height] = useState<number>(172); // cm
  const [history, setHistory] = useState<WeightEntry[]>([
    { date: "20 ต.ค.", weight: 74.5 },
    { date: "21 ต.ค.", weight: 74.2 },
    { date: "22 ต.ค.", weight: 73.8 },
    { date: "23 ต.ค.", weight: 73.9 },
    { date: "24 ต.ค.", weight: 73.5 },
    { date: "25 ต.ค.", weight: 73.2 },
    { date: "26 ต.ค.", weight: 73.0 },
  ]);
  const [isLoggedToday, setIsLoggedToday] = useState(false);

  const currentWeightNum = parseFloat(weight) || 73.0;
  const bmiInfo = calculateBMI(currentWeightNum, height);
  const diffFromTarget = (currentWeightNum - targetWeight).toFixed(1);

  const handleLogWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weight);
    if (!val || val < 30 || val > 250) return;

    const todayLabel = "วันนี้";
    setHistory((prev) => [...prev.slice(1), { date: todayLabel, weight: val }]);
    setIsLoggedToday(true);
    setTimeout(() => setIsLoggedToday(false), 3000);
  };

  // กราฟ Chart.js
  const chartData = {
    labels: history.map((h) => h.date),
    datasets: [
      {
        label: "น้ำหนัก (กก.)",
        data: history.map((h) => h.weight),
        borderColor: "#007AFF",
        backgroundColor: "rgba(0, 122, 255, 0.08)",
        borderWidth: 3,
        pointBackgroundColor: "#007AFF",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
        fill: true,
      },
      {
        label: "เป้าหมาย (68 กก.)",
        data: history.map(() => targetWeight),
        borderColor: "#34C759",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 10,
          font: { size: 11, family: "-apple-system, sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(28, 28, 30, 0.9)",
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        min: 65,
        max: 76,
        ticks: { font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
      x: {
        ticks: { font: { size: 10 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">บันทึกน้ำหนัก & ดัชนี BMI</h3>
            <p className="text-xs text-gray-500">เป้าหมายลดลงอีก {diffFromTarget} กิโลกรัม</p>
          </div>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
          สูง {height} ซม.
        </span>
      </div>

      {/* สรุปน้ำหนักปัจจุบัน & BMI Badge */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100">
          <span className="text-[11px] font-medium text-gray-500">น้ำหนักปัจจุบัน</span>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-bold tracking-tight text-gray-900">{weight}</span>
            <span className="text-xs text-gray-500 font-medium">กก.</span>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-[11px] text-emerald-600 font-medium">
            <TrendingDown className="h-3 w-3" />
            <span>-1.5 กก. สัปดาห์นี้</span>
          </div>
        </div>

        <div className="rounded-2xl bg-gray-50/80 p-3.5 border border-gray-100">
          <span className="text-[11px] font-medium text-gray-500">ค่าดัชนี BMI</span>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className={`text-2xl font-bold tracking-tight ${bmiInfo.color}`}>
              {bmiInfo.bmi}
            </span>
          </div>
          <span className="inline-block mt-1 text-[11px] font-medium text-gray-600 truncate">
            {bmiInfo.category}
          </span>
        </div>
      </div>

      {/* กราฟแนวโน้มน้ำหนัก */}
      <div className="mt-4 h-48 w-full">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* ฟอร์มกรอกน้ำหนักประจำวัน */}
      <form onSubmit={handleLogWeight} className="mt-4 flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="เช่น 72.8"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
          />
          <span className="absolute right-3.5 top-3 text-xs text-gray-400">กก.</span>
        </div>
        <button
          type="submit"
          className="inline-flex items-center space-x-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-blue-700 active:scale-95 transition"
        >
          {isLoggedToday ? (
            <>
              <Check className="h-4 w-4" />
              <span>บันทึกแล้ว!</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>บันทึก</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
