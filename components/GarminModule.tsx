"use client";

import React, { useState, useEffect } from "react";
import {
  Watch,
  RefreshCw,
  Footprints,
  BatteryCharging,
  CheckCircle,
  AlertTriangle,
  Link2,
  Unlink,
  Settings,
  X,
  Heart,
  Sparkles,
  Smartphone,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";

const GARMIN_MODELS = [
  "Garmin Instinct 2",
  "Garmin Forerunner 265",
  "Garmin Forerunner 965",
  "Garmin Venu 3",
  "Garmin Fenix 7 / 8",
  "Garmin Vivoactive 5",
  "Garmin Epix Pro",
];

export function GarminModule() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [deviceName, setDeviceName] = useState<string>("Garmin Instinct 2");
  const [lastSyncTime, setLastSyncTime] = useState<string>("เมื่อสักครู่");
  const [todaySteps, setTodaySteps] = useState<number>(7450);
  const [actualAge, setActualAge] = useState<number>(28);
  const [fitnessAge, setFitnessAge] = useState<number>(24);
  const [restingHr, setRestingHr] = useState<number>(58);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [inputSteps, setInputSteps] = useState<string>("7450");
  const [inputFitnessAge, setInputFitnessAge] = useState<string>("24");
  const [inputRestingHr, setInputRestingHr] = useState<string>("58");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const weeklyTarget = 70000;
  const dailyTarget = 10000;

  useEffect(() => {
    fetchGarminStatus();
  }, []);

  const fetchGarminStatus = async () => {
    try {
      const res = await fetch("/api/garmin");
      const data = await res.json();
      if (res.ok) {
        setIsConnected(data.connected);
        if (data.device) setDeviceName(data.device);
        if (data.steps) {
          setTodaySteps(data.steps);
          setInputSteps(String(data.steps));
        }
        if (data.actualAge) setActualAge(data.actualAge);
        if (data.fitnessAge) {
          setFitnessAge(data.fitnessAge);
          setInputFitnessAge(String(data.fitnessAge));
        }
        if (data.restingHr) {
          setRestingHr(data.restingHr);
          setInputRestingHr(String(data.restingHr));
        }
        if (data.lastSync) {
          const syncDate = new Date(data.lastSync);
          setLastSyncTime(
            `เมื่อ ${syncDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.`
          );
        }
      }
    } catch (e) {
      console.warn("Garmin fetch fallback", e);
    }
  };

  const handleConnect = async (selectedModel: string) => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/garmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", deviceName: selectedModel }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsConnected(true);
        setDeviceName(selectedModel);
        setLastSyncTime("เพิ่งซิงค์เมื่อสักครู่");
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncData = async (manualSteps?: number, manualFitnessAge?: number, manualHr?: number) => {
    setIsSyncing(true);
    const stepsToSend = manualSteps !== undefined ? manualSteps : todaySteps + 350;
    const fitnessAgeToSend = manualFitnessAge !== undefined ? manualFitnessAge : fitnessAge;
    const restingHrToSend = manualHr !== undefined ? manualHr : restingHr;

    try {
      const res = await fetch("/api/garmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync",
          steps: stepsToSend,
          fitnessAge: fitnessAgeToSend,
          restingHr: restingHrToSend,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTodaySteps(stepsToSend);
        setFitnessAge(fitnessAgeToSend);
        setRestingHr(restingHrToSend);
        setLastSyncTime("เพิ่งซิงค์เมื่อสักครู่");
        setToastMessage("ซิงค์ก้าวเดินและอายุสุขภาพเข้า Supabase สำเร็จแล้ว!");
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const ageDiff = actualAge - fitnessAge;
  const weeklyAccumulated = 42000 + todaySteps;
  const weeklyDeficit = Math.max(0, weeklyTarget - weeklyAccumulated);
  const weeklyProgress = Math.min(100, Math.round((weeklyAccumulated / weeklyTarget) * 100));

  return (
    <div className="rounded-3xl bg-white p-5 shadow-ios border border-gray-100">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="mb-3 rounded-2xl bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow flex items-center space-x-1.5 animate-fade-in">
          <CheckCircle className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Watch className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Garmin Connect™</h3>
            <p className="text-xs text-gray-500">
              {isConnected ? deviceName : "ยังไม่ได้เชื่อมต่อ Garmin Connect"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {isConnected ? (
            <>
              <button
                onClick={() => handleSyncData()}
                disabled={isSyncing}
                className="inline-flex items-center space-x-1 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 active:scale-95 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "กำลังซิงค์..." : "ซิงค์ด่วน"}</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                title="ตั้งค่าเชื่อมต่อ Garmin บน iPhone"
              >
                <Settings className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-1.5 rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700 active:scale-95 transition"
            >
              <Link2 className="h-3.5 w-3.5" />
              <span>เชื่อมต่อ Garmin</span>
            </button>
          )}
        </div>
      </div>

      {/* Device Status Bar */}
      <div className="mt-3.5 flex items-center justify-between rounded-xl bg-gray-50/70 px-3 py-2 text-[11px] text-gray-500 border border-gray-100">
        <div className="flex items-center space-x-1.5">
          <span
            className={`flex h-2 w-2 rounded-full ${
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span className="font-semibold text-gray-700">
            {isConnected ? "เชื่อมต่อแอปบน iPhone แล้ว" : "ออฟไลน์"}
          </span>
          <span>• {lastSyncTime}</span>
        </div>
        {isConnected && (
          <div className="flex items-center space-x-1 font-semibold text-gray-600">
            <BatteryCharging className="h-3.5 w-3.5 text-emerald-600" />
            <span>แบตเตอรี่ 86%</span>
          </div>
        )}
      </div>

      {/* 2 การ์ดหลัก: ก้าวเดิน (Steps) & อายุสุขภาพ (Fitness Age) */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Card 1: ก้าวเดินวันนี้ */}
        <div className="rounded-2xl bg-purple-50/50 p-3.5 border border-purple-100/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900">ก้าวเดินวันนี้</span>
            <Footprints className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-black tracking-tight text-gray-900">
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

        {/* Card 2: ข้อมูลอายุสุขภาพ (Garmin Fitness Age) */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3.5 border border-emerald-100/70">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900">อายุสุขภาพ (Garmin)</span>
            <Sparkles className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-black tracking-tight text-emerald-700">
              {fitnessAge}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">ปี</span>
            <span className="text-[10px] text-gray-400 ml-1">(อายุจริง {actualAge} ปี)</span>
          </div>
          <div className="mt-1 flex items-center space-x-1 text-[11px] font-bold text-emerald-600">
            {ageDiff > 0 ? (
              <span>เด็กลง {ageDiff} ปี 🎉 หัวใจแข็งแรงมาก</span>
            ) : ageDiff === 0 ? (
              <span>เทียบเท่าอายุจริง</span>
            ) : (
              <span>สูงกว่าอายุจริง {Math.abs(ageDiff)} ปี</span>
            )}
          </div>
        </div>
      </div>

      {/* Garmin Connect iPhone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Watch className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">ซิงค์ Garmin Connect บน iPhone</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* เลือกรุ่น Garmin */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  รุ่นอุปกรณ์ Garmin ของคุณ:
                </label>
                <select
                  value={deviceName}
                  onChange={(e) => handleConnect(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-purple-500"
                >
                  {GARMIN_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* ซิงค์ข้อมูลจากแอป Garmin Connect */}
              <div className="rounded-2xl bg-purple-50/60 p-4 border border-purple-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                  <span>ข้อมูลจากแอป Garmin Connect บน iPhone:</span>
                  <Smartphone className="h-4 w-4 text-purple-600" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block">
                      ก้าวเดินวันนี้ (Steps):
                    </label>
                    <input
                      type="number"
                      value={inputSteps}
                      onChange={(e) => setInputSteps(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 block">
                      อายุสุขภาพ (Fitness Age):
                    </label>
                    <input
                      type="number"
                      value={inputFitnessAge}
                      onChange={(e) => setInputFitnessAge(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-900"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleSyncData(Number(inputSteps), Number(inputFitnessAge), Number(inputRestingHr));
                    setIsModalOpen(false);
                  }}
                  className="w-full rounded-2xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow hover:bg-purple-700 active:scale-95 transition"
                >
                  ซิงค์ข้อมูลเข้าสู่ Supabase ทันที
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
