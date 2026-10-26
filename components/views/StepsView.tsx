"use client";

import React, { useState } from "react";
import {
  Footprints,
  Flame,
  Award,
  BellRing,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { GarminModule } from "@/components/GarminModule";
import { WalkTimer } from "@/components/WalkTimer";
import { UserProfile } from "@/types";

interface StepsViewProps {
  userProfile: UserProfile;
}

export function StepsView({ userProfile }: StepsViewProps) {
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [pushSentToast, setPushSentToast] = useState(false);

  const handleSendStepsPush = async () => {
    setIsSendingPush(true);
    try {
      const res = await fetch("/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "steps" }),
      });
      if (res.ok) {
        setPushSentToast(true);
        setTimeout(() => setPushSentToast(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingPush(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {pushSentToast && (
        <div className="rounded-2xl bg-purple-600 px-4 py-3 text-xs font-semibold text-white shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>ส่งแจ้งเตือนกระตุ้นก้าวเดินไปยัง iPhone สำเร็จแล้ว!</span>
          </div>
        </div>
      )}

      {/* 1. Garmin Connect Module & Weekly Step Deficit */}
      <GarminModule />

      {/* 2. Walking Countdown Timer */}
      <WalkTimer />

      {/* 3. Steps Encouragement Banner */}
      <div className="rounded-3xl bg-purple-50 p-4 border border-purple-100 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-purple-900">นั่งนานเกิน 1 ชั่วโมงหรือยัง?</h4>
          <p className="text-[11px] text-purple-700">ลุกขึ้นมาเดินยืดเส้นยืดสาย 5 นาที ช่วยเพิ่มอัตราเผาผลาญ</p>
        </div>
        <button
          onClick={handleSendStepsPush}
          disabled={isSendingPush}
          className="rounded-full bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700 active:scale-95 transition disabled:opacity-50 flex-shrink-0"
        >
          <BellRing className="h-3.5 w-3.5 inline-block mr-1" />
          <span>{isSendingPush ? "กำลังส่ง..." : "ยิงเตือนลุกเดิน"}</span>
        </button>
      </div>
    </div>
  );
}
