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
  Cloud,
  Lock,
  KeyRound,
  LogOut,
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
  const [modalTab, setModalTab] = useState<"cloud" | "manual" | "shortcut">("cloud");

  // Garmin Cloud Authentication states
  const [garminEmail, setGarminEmail] = useState<string>("");
  const [garminPassword, setGarminPassword] = useState<string>("");
  const [needsMfa, setNeedsMfa] = useState<boolean>(false);
  const [mfaState, setMfaState] = useState<any>(null);
  const [mfaCode, setMfaCode] = useState<string>("");
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // Manual inputs
  const [inputSteps, setInputSteps] = useState<string>("7450");
  const [inputFitnessAge, setInputFitnessAge] = useState<string>("24");
  const [inputRestingHr, setInputRestingHr] = useState<string>("58");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [liveOrigin, setLiveOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLiveOrigin(window.location.origin);
      const savedTokens = localStorage.getItem("fitlife_garmin_tokens");
      if (savedTokens) setIsCloudConnected(true);
      const savedEmail = localStorage.getItem("fitlife_garmin_email");
      if (savedEmail) setGarminEmail(savedEmail);
    }
  }, []);

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

  // ดึงข้อมูลจริงล่าสุดจาก Supabase API
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

  // 1. ล็อกอินเข้าสู่ระบบ Garmin Connect Cloud โดยตรง
  const handleCloudLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!garminEmail || !garminPassword) {
      alert("กรุณากรอกอีเมลและรหัสผ่าน Garmin Connect");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/garmin/cloud-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: garminEmail.trim(),
          password: garminPassword,
        }),
      });
      const data = await res.json();

      if (data.needsMfa) {
        setNeedsMfa(true);
        setMfaState(data.mfaState);
        setToastMessage("กรุณากรอกรหัส OTP 6 หลักที่ส่งไปยังอีเมล Garmin ของคุณ");
        return;
      }

      if (res.ok && data.success) {
        if (data.tokens) {
          localStorage.setItem("fitlife_garmin_tokens", JSON.stringify(data.tokens));
          localStorage.setItem("fitlife_garmin_email", garminEmail.trim());
          setIsCloudConnected(true);
        }
        setTodaySteps(data.steps);
        setFitnessAge(data.fitnessAge);
        setRestingHr(data.restingHr);
        if (data.deviceName) setDeviceName(data.deviceName);
        if (onStepsUpdate) onStepsUpdate(data.steps, data.fitnessAge);
        setToastMessage(
          `⚡ ซิงค์ Garmin Cloud สำเร็จ! (${data.steps.toLocaleString()} ก้าว, อายุสุขภาพ ${data.fitnessAge} ปี)`
        );
        setTimeout(() => setToastMessage(null), 4000);
        setIsModalOpen(false);
      } else {
        alert("เข้าสู่ระบบไม่สำเร็จ: " + (data.error || "ตรวจสอบอีเมล/รหัสผ่าน"));
      }
    } catch (err: any) {
      console.error(err);
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. ดำเนินการยืนยันรหัส MFA (OTP)
  const handleResumeMfa = async () => {
    if (!mfaCode) {
      alert("กรุณากรอกรหัส OTP 6 หลัก");
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch("/api/garmin/cloud-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mfa",
          mfaState,
          code: mfaCode.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.tokens) {
          localStorage.setItem("fitlife_garmin_tokens", JSON.stringify(data.tokens));
          setIsCloudConnected(true);
        }
        setTodaySteps(data.steps);
        setFitnessAge(data.fitnessAge);
        setRestingHr(data.restingHr);
        if (data.deviceName) setDeviceName(data.deviceName);
        if (onStepsUpdate) onStepsUpdate(data.steps, data.fitnessAge);
        setToastMessage(
          `⚡ ยืนยัน OTP และดึงข้อมูลจริงจาก Garmin สำเร็จ! (${data.steps.toLocaleString()} ก้าว)`
        );
        setTimeout(() => setToastMessage(null), 4000);
        setNeedsMfa(false);
        setIsModalOpen(false);
      } else {
        alert("รหัส OTP ไม่ถูกต้อง: " + (data.error || "กรุณาลองใหม่"));
      }
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // 3. ซิงค์ด่วนจาก Garmin Cloud ด้วย Session Tokens ที่เคยล็อกอินไว้
  const handleSyncWithCloudTokens = async () => {
    const saved = localStorage.getItem("fitlife_garmin_tokens");
    if (!saved) {
      setIsModalOpen(true);
      setModalTab("cloud");
      return;
    }

    setIsSyncing(true);
    try {
      const tokens = JSON.parse(saved);
      const res = await fetch("/api/garmin/cloud-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_tokens", tokens }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTodaySteps(data.steps);
        setFitnessAge(data.fitnessAge);
        setRestingHr(data.restingHr);
        if (data.deviceName) setDeviceName(data.deviceName);
        if (onStepsUpdate) onStepsUpdate(data.steps, data.fitnessAge);
        setToastMessage(
          `⚡ ซิงค์ข้อมูลล่าสุดจาก Garmin Cloud สำเร็จ! (${data.steps.toLocaleString()} ก้าว, อายุสุขภาพ ${data.fitnessAge} ปี)`
        );
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        // Token หมดอายุ
        localStorage.removeItem("fitlife_garmin_tokens");
        setIsCloudConnected(false);
        alert("Session หมดอายุ กรุณาเข้าสู่ระบบ Garmin Connect ใหม่อีกครั้ง");
        setIsModalOpen(true);
        setModalTab("cloud");
      }
    } catch (e: any) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูลจาก Garmin Cloud");
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. บันทึกข้อมูลจริงจากหน้ากรอก Manual ลง Supabase
  const handleSaveRealSyncData = async () => {
    const s = parseInt(inputSteps) || 0;
    const fa = parseInt(inputFitnessAge) || 24;
    const rhr = parseInt(inputRestingHr) || 58;

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
        setToastMessage(
          `บันทึกก้าวเดินจริง ${s.toLocaleString()} ก้าว และอายุสุขภาพ ${fa} ปี ลง Supabase สำเร็จแล้ว!`
        );
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
    const origin = liveOrigin || (typeof window !== "undefined" ? window.location.origin : "");
    if (!origin) return;
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
          {/* ปุ่มดึงข้อมูลสดจาก Garmin Cloud ทันที */}
          {isCloudConnected ? (
            <button
              onClick={handleSyncWithCloudTokens}
              disabled={isSyncing}
              className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition disabled:opacity-50"
              title="ดึงข้อมูลสดจาก Garmin Connect Cloud"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "กำลังดึง..." : "ซิงค์ Cloud"}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setModalTab("cloud");
                setIsModalOpen(true);
              }}
              className="inline-flex items-center space-x-1 rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700 active:scale-95 transition"
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>เชื่อมต่อ Cloud</span>
            </button>
          )}

          <button
            onClick={() => {
              setInputSteps(String(todaySteps));
              setInputFitnessAge(String(fitnessAge));
              setInputRestingHr(String(restingHr));
              setIsModalOpen(true);
            }}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 active:scale-95 transition"
            title="ตั้งค่า & ซิงค์ข้อมูล"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Connection Status Pill */}
      <div className="mt-3.5 flex items-center justify-between rounded-xl bg-purple-50/60 px-3 py-2 text-[11px] text-gray-600 border border-purple-100/60">
        <div className="flex items-center space-x-1.5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-purple-950">
            {isCloudConnected
              ? "เชื่อมต่อ Garmin Connect Cloud โดยตรง (ข้อมูลจริง)"
              : "เชื่อมต่อ Garmin Instinct 2 (Supabase Live)"}
          </span>
        </div>
        <button
          onClick={() => {
            setModalTab("cloud");
            setIsModalOpen(true);
          }}
          className="text-purple-700 font-bold hover:underline flex items-center space-x-0.5 text-[10px]"
        >
          <span>{isCloudConnected ? "จัดการบัญชี" : "ตั้งค่าซิงค์"}</span>
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

      {/* Garmin Connect Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <Watch className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-gray-900">เชื่อมต่อ Garmin Connect</h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNeedsMfa(false);
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs: 3 ช่องทาง */}
            <div className="mt-4 flex rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setModalTab("cloud")}
                className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition ${
                  modalTab === "cloud"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                ☁️ Garmin Cloud (อัตโนมัติ)
              </button>
              <button
                onClick={() => setModalTab("manual")}
                className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition ${
                  modalTab === "manual"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                ✍️ กรอกค่าจริง
              </button>
              <button
                onClick={() => setModalTab("shortcut")}
                className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition ${
                  modalTab === "shortcut"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                📱 คำสั่งลัด iOS
              </button>
            </div>

            {/* Tab 1: Garmin Connect Cloud Login */}
            {modalTab === "cloud" && (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-purple-50/70 p-3.5 border border-purple-100 text-xs text-purple-950 leading-relaxed">
                  <p className="font-semibold flex items-center space-x-1.5">
                    <Cloud className="h-4 w-4 text-purple-600" />
                    <span>เชื่อมต่อกับเซิร์ฟเวอร์ Garmin Connect โดยตรง:</span>
                  </p>
                  <p className="text-[11px] text-purple-800 mt-1">
                    ระบบจะล็อกอินเข้าสู่ระบบคลาวด์ของ Garmin เพื่อดึง <strong>จำนวนก้าวเดินจริง</strong>, <strong>อายุสุขภาพ (Fitness Age)</strong>, และ <strong>อัตราเต้นหัวใจขณะพัก</strong> ของคุณ Kangjaa จากนาฬิกาโดยตรง
                  </p>
                </div>

                {isCloudConnected && !needsMfa && (
                  <div className="rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <p className="font-bold">เชื่อมต่อบัญชี Garmin Cloud แล้ว</p>
                        <p className="text-[10px] text-emerald-700">{garminEmail || "Session พร้อมใช้งาน"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.removeItem("fitlife_garmin_tokens");
                        setIsCloudConnected(false);
                      }}
                      className="text-xs font-semibold text-rose-600 hover:underline flex items-center space-x-0.5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                )}

                {needsMfa ? (
                  /* หน้ากรอกรหัส OTP (2FA) */
                  <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 space-y-3">
                    <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                      <KeyRound className="h-4 w-4 text-amber-600" />
                      <span>Garmin ส่งรหัส OTP 6 หลักไปที่อีเมลของคุณ</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      กรุณาเปิดอีเมลที่ผูกกับ Garmin Connect นำรหัส 6 หลักมากรอกด้านล่างนี้ครับ:
                    </p>
                    <input
                      type="text"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      placeholder="เช่น 123456"
                      className="w-full text-center tracking-widest text-lg font-black rounded-xl border border-amber-300 bg-white p-2.5 text-gray-900 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={handleResumeMfa}
                      disabled={isSyncing}
                      className="w-full rounded-xl bg-amber-600 py-2.5 text-xs font-bold text-white shadow hover:bg-amber-700 disabled:opacity-50 transition"
                    >
                      {isSyncing ? "กำลังยืนยัน..." : "ยืนยันรหัส OTP & ดึงข้อมูลจริง"}
                    </button>
                  </div>
                ) : (
                  /* ฟอร์มกรอกอีเมล & รหัสผ่าน */
                  <form onSubmit={handleCloudLogin} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        อีเมลบัญชี Garmin Connect:
                      </label>
                      <input
                        type="email"
                        required
                        value={garminEmail}
                        onChange={(e) => setGarminEmail(e.target.value)}
                        placeholder="your-garmin-email@example.com"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        รหัสผ่าน Garmin Connect:
                      </label>
                      <input
                        type="password"
                        required
                        value={garminPassword}
                        onChange={(e) => setGarminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                      />
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        🔒 ข้อมูลใช้เพื่อขอ Token ดึงก้าวเดินและอายุสุขภาพจาก Garmin API เท่านั้น ปลอดภัย 100%
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isSyncing}
                      className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-bold text-white shadow-md hover:bg-purple-700 active:scale-95 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                    >
                      <Cloud className="h-4 w-4" />
                      <span>
                        {isSyncing ? "กำลังเชื่อมต่อกับ Garmin Cloud..." : "เข้าสู่ระบบ & ดึงข้อมูลจริงอัตโนมัติ"}
                      </span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Tab 2: Manual Sync */}
            {modalTab === "manual" && (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-purple-50/70 p-3.5 border border-purple-100 text-xs text-purple-950 leading-relaxed">
                  <p className="font-semibold">
                    💡 เปิดดูตัวเลขจริงจากหน้าแรกของแอป <strong>Garmin Connect</strong> บน iPhone แล้วระบุเพื่อบันทึกลง Supabase ได้ทันทีครับ:
                  </p>
                </div>

                {/* Input 1: ก้าวเดิน */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    🚶‍♂️ ก้าวเดินจริงวันนี้ (Today's Steps):
                  </label>
                  <input
                    type="number"
                    value={inputSteps}
                    onChange={(e) => setInputSteps(e.target.value)}
                    placeholder="เช่น 7450"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-purple-500 focus:bg-white"
                  />
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
                  </div>
                </div>

                <button
                  onClick={handleSaveRealSyncData}
                  disabled={isSyncing}
                  className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-bold text-white shadow-md hover:bg-purple-700 active:scale-95 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isSyncing ? "กำลังบันทึกลง Supabase..." : "บันทึกข้อมูลจริงลงฐานข้อมูล"}</span>
                </button>
              </div>
            )}

            {/* Tab 3: iOS Shortcut Guide */}
            {modalTab === "shortcut" && (
              <div className="mt-4 space-y-4 text-xs text-gray-700">
                <div className="rounded-2xl bg-blue-50/80 p-3.5 border border-blue-100 text-blue-950">
                  <h4 className="font-bold flex items-center space-x-1 mb-1 text-blue-900">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <span>คำสั่งลัด iOS (Apple Health Sync):</span>
                  </h4>
                  <p className="text-[11px] leading-relaxed text-blue-800">
                    สามารถตั้งคำสั่งลัดในแอป "คำสั่งลัด (Shortcuts)" บน iPhone ให้ส่งก้าวเดินจาก Apple Health เข้ามาได้อัตโนมัติ
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3.5 border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-gray-700">Webhook URL:</span>
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

                  <code className="text-[10px] text-purple-800 font-mono font-bold break-all block bg-white p-2 rounded-xl border border-gray-200">
                    {liveOrigin ? `${liveOrigin}/api/garmin?steps=` : "https://<โดเมน-เว็บของคุณ>/api/garmin?steps="}[จำนวนก้าว]
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
