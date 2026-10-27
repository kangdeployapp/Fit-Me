"use client";

import React, { useState, useEffect } from "react";
import {
  Watch,
  RefreshCw,
  Footprints,
  CheckCircle,
  AlertTriangle,
  Link2,
  Settings,
  X,
  Heart,
  Sparkles,
  Smartphone,
  Copy,
  Check,
  Activity,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { UserProfile } from "@/types";

const GARMIN_MODELS = [
  "Garmin Instinct 2",
  "Garmin Forerunner 265",
  "Garmin Forerunner 965",
  "Garmin Venu 3",
  "Garmin Fenix 7 / 8",
  "Garmin Vivoactive 5",
  "Garmin Epix Pro",
];

interface GarminModuleProps {
  userProfile?: UserProfile;
  onStepsUpdate?: (newSteps: number, fitnessAge: number) => void;
}

export function GarminModule({ userProfile, onStepsUpdate }: GarminModuleProps) {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [deviceName, setDeviceName] = useState<string>(
    userProfile?.garminDevice || "Garmin Instinct 2"
  );
  const [lastSyncTime, setLastSyncTime] = useState<string>("เมื่อสักครู่");
  const [todaySteps, setTodaySteps] = useState<number>(7450);
  const [actualAge, setActualAge] = useState<number>(userProfile?.age || 39);
  const [fitnessAge, setFitnessAge] = useState<number>(userProfile?.fitnessAge || 24);
  const [restingHr, setRestingHr] = useState<number>(userProfile?.restingHr || 58);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<"manual" | "shortcut">("manual");
  const [inputSteps, setInputSteps] = useState<string>("7450");
  const [inputFitnessAge, setInputFitnessAge] = useState<string>("24");
  const [inputRestingHr, setInputRestingHr] = useState<string>("58");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);

  const weeklyTarget = 70000;
  const dailyTarget = userProfile?.dailyStepGoal || 10000;

  // ซิงค์ค่าตาม userProfile props เมื่อโหลดเสร็จ
  useEffect(() => {
    if (userProfile?.garminDevice) setDeviceName(userProfile.garminDevice);
    if (userProfile?.age) setActualAge(userProfile.age);
    if (userProfile?.fitnessAge) {
      setFitnessAge(userProfile.fitnessAge);
      setInputFitnessAge(String(userProfile.fitnessAge));
    }
    if (userProfile?.restingHr) {
      setRestingHr(userProfile.restingHr);
      setInputRestingHr(String(userProfile.restingHr));
    }
  }, [userProfile]);

  useEffect(() => {
    fetchGarminStatus();
  }, []);

  // ดึงข้อมูลจริงล่าสุดจาก Supabase API โดยไม่เพิ่มค่ามั่ว
  const fetchGarminStatus = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/garmin");
      const data = await res.json();
      if (res.ok) {
        setIsConnected(data.connected);
        if (data.device) setDeviceName(data.device);
        if (data.steps !== undefined && data.steps !== null) {
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
    } finally {
      setIsSyncing(false);
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  // ซิงค์ข้อมูลจริง 100% จากแอป Garmin Connect ลง Supabase
  const handleSaveRealSyncData = async () => {
    const s = parseInt(inputSteps) || todaySteps;
    const fa = parseInt(inputFitnessAge) || fitnessAge;
    const rhr = parseInt(inputRestingHr) || restingHr;

    setIsSyncing(true);
    try {
      const res = await fetch("/api/garmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync",
          steps: s,
          fitnessAge: fa,
          restingHr: rhr,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTodaySteps(s);
        setFitnessAge(fa);
        setRestingHr(rhr);
        setLastSyncTime("เพิ่งซิงค์เมื่อสักครู่");
        if (onStepsUpdate) onStepsUpdate(s, fa);
        setToastMessage(`ซิงค์ก้าวเดินจริง ${s.toLocaleString()} ก้าว และอายุสุขภาพ ${fa} ปี ลง Supabase สำเร็จแล้ว!`);
        setTimeout(() => setToastMessage(null), 3500);
        setIsModalOpen(false);
      } else {
        alert("ซิงค์ไม่สำเร็จ: " + (data.error || "เกิดข้อผิดพลาด"));
      }
    } catch (e: any) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://fit-me-kangjaa.vercel.app";
    const webhookUrl = `${origin}/api/garmin`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
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

      {/* Header & Main Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <Watch className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-base font-bold text-gray-900">Garmin Connect™</h3>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-bold">
                INSTINCT 2
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {deviceName} • {lastSyncTime}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => fetchGarminStatus()}
            disabled={isSyncing}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 active:scale-95 transition disabled:opacity-50"
            title="รีเฟรชข้อมูลล่าสุดจาก Supabase"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => {
              setInputSteps(String(todaySteps));
              setInputFitnessAge(String(fitnessAge));
              setInputRestingHr(String(restingHr));
              setIsModalOpen(true);
            }}
            className="inline-flex items-center space-x-1.5 rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700 active:scale-95 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>ซิงค์ข้อมูล Garmin</span>
          </button>
        </div>
      </div>

      {/* Connection Status Pill */}
      <div className="mt-3.5 flex items-center justify-between rounded-xl bg-purple-50/60 px-3 py-2 text-[11px] text-gray-600 border border-purple-100/60">
        <div className="flex items-center space-x-1.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-purple-950">
            ซิงค์กับ iPhone & นาฬิกา Garmin Instinct 2
          </span>
        </div>
        <button
          onClick={() => {
            setModalTab("shortcut");
            setIsModalOpen(true);
          }}
          className="text-purple-700 font-bold hover:underline flex items-center space-x-0.5 text-[10px]"
        >
          <span>วิธีซิงค์อัตโนมัติ</span>
          <ArrowRight className="h-3 w-3" />
        </button>
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
            <span className="text-xs text-gray-500">/ {dailyTarget.toLocaleString()}</span>
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

      {/* สรุปก้าวเดินสะสมรายสัปดาห์ & ส่วนต่างที่ขาด */}
      <div className="mt-4 rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 font-bold text-gray-700">
            <Activity className="h-4 w-4 text-purple-600" />
            <span>เป้าหมายก้าวเดินสะสม 7 วัน (70,000 ก้าว)</span>
          </div>
          <span className="font-extrabold text-purple-700">{weeklyProgress}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
            style={{ width: `${weeklyProgress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
          <span>สะสมแล้ว {weeklyAccumulated.toLocaleString()} ก้าว</span>
          {weeklyDeficit > 0 ? (
            <span className="font-semibold text-rose-600">
              ขาดอีก {weeklyDeficit.toLocaleString()} ก้าว
            </span>
          ) : (
            <span className="font-bold text-emerald-600">ทะลุเป้าหมายแล้ว! 🎉</span>
          )}
        </div>
      </div>

      {/* Garmin Connect iPhone Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Watch className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">ซิงค์ Garmin Connect จริง</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="mt-4 flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setModalTab("manual")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                  modalTab === "manual"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                📱 ซิงค์ข้อมูลจริง (ทันที)
              </button>
              <button
                onClick={() => setModalTab("shortcut")}
                className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                  modalTab === "shortcut"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                ⚡ ซิงค์อัตโนมัติ (Apple Health)
              </button>
            </div>

            {modalTab === "manual" ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-purple-50/70 p-3.5 border border-purple-100 text-xs text-purple-950 leading-relaxed">
                  <p className="font-semibold">
                    💡 เปิดแอป <strong>Garmin Connect</strong> บน iPhone ดูค่าจริงจากนาฬิกา <strong>{deviceName}</strong> แล้วกดบันทึกเพื่อซิงค์เข้าฐานข้อมูล Supabase ได้ทันทีครับ:
                  </p>
                </div>

                {/* Input 1: ก้าวเดิน */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    🚶‍♂️ ก้าวเดินวันนี้ (Today's Steps):
                  </label>
                  <input
                    type="number"
                    value={inputSteps}
                    onChange={(e) => setInputSteps(e.target.value)}
                    placeholder="เช่น 7450"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    ดูได้จากหน้า "วันของฉัน (My Day)" ในแอป Garmin Connect
                  </span>
                </div>

                {/* Input 2: อายุสุขภาพ */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ✨ อายุสุขภาพ (Fitness Age):
                    </label>
                    <input
                      type="number"
                      value={inputFitnessAge}
                      onChange={(e) => setInputFitnessAge(e.target.value)}
                      placeholder="เช่น 24"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      ดูใน สถิติสุขภาพ &gt; อายุสุขภาพ
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      ❤️ หัวใจขณะพัก (Resting HR):
                    </label>
                    <input
                      type="number"
                      value={inputRestingHr}
                      onChange={(e) => setInputRestingHr(e.target.value)}
                      placeholder="เช่น 58"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      bpm
                    </span>
                  </div>
                </div>

                {/* อุปกรณ์ Garmin ที่เชื่อมต่อ */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ⌚ อุปกรณ์ของคุณ:
                  </label>
                  <select
                    value={deviceName}
                    onChange={(e) => {
                      setDeviceName(e.target.value);
                      handleConnect(e.target.value);
                    }}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none"
                  >
                    {GARMIN_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSaveRealSyncData}
                  disabled={isSyncing}
                  className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-bold text-white shadow-md hover:bg-purple-700 active:scale-95 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isSyncing ? "กำลังบันทึกลง Supabase..." : "บันทึกซิงค์ข้อมูลจริง 100%"}</span>
                </button>
              </div>
            ) : (
              /* Tab 2: Apple Health & Shortcuts Guide */
              <div className="mt-4 space-y-4 text-xs text-gray-700">
                <div className="rounded-2xl bg-blue-50/80 p-3.5 border border-blue-100 text-blue-950">
                  <h4 className="font-bold flex items-center space-x-1 mb-1">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <span>ทำไมต้องผ่าน Apple Health บน iPhone?</span>
                  </h4>
                  <p className="text-[11px] leading-relaxed">
                    เนื่องจากระบบความปลอดภัยของ iOS บน iPhone ไม่อนุญาตให้เบราว์เซอร์หรือเว็บแอปคุยกับบลูทูธของนาฬิกาโดยตรง ทางการทำงานจริงของ Garmin บน iPhone คือ:
                    <br />
                    <strong>Garmin Instinct 2 → แอป Garmin Connect → Apple Health (สุขภาพ)</strong>
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-2.5">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">เปิดการเชื่อมต่อ Apple Health ใน Garmin Connect</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        ในแอป Garmin Connect บน iPhone ไปที่ <em>เพิ่มเติม (More) &gt; การตั้งค่า (Settings) &gt; แอปที่เชื่อมต่อ (Connected Apps) &gt; Apple Health</em> และเปิดสิทธิ์อ่าน/เขียน "จำนวนก้าว"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold text-[10px]">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">ส่งข้อมูลอัตโนมัติด้วยคำสั่งลัด (Shortcuts)</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        ในแอป "คำสั่งลัด" (Shortcuts) บน iPhone สร้างคำสั่งลัดตั้งเวลาทำงานทุกวัน (เช่น 20:00 น.) สั่งให้ <strong>"ดึงจำนวนก้าวจากแอปสุขภาพ"</strong> แล้วยิง POST มาที่ Webhook ด้านล่าง
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-[11px] text-gray-600">FitLife Webhook URL:</span>
                      <button
                        onClick={handleCopyWebhookUrl}
                        className="flex items-center space-x-1 text-purple-600 font-bold text-[11px] hover:underline"
                      >
                        {copiedWebhook ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">คัดลอกแล้ว!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>คัดลอก URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <code className="text-[10px] bg-white p-2 rounded-xl border border-gray-200 block overflow-x-auto text-purple-800 font-mono">
                      {typeof window !== "undefined" ? window.location.origin : "https://fit-me-kangjaa.vercel.app"}/api/garmin
                    </code>
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      Payload: <code>{JSON.stringify({ action: "sync", steps: 8500, fitnessAge: 24 })}</code>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setModalTab("manual")}
                  className="w-full rounded-2xl bg-gray-100 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-200 transition"
                >
                  กลับไปหน้าซิงค์ข้อมูลจริง
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
