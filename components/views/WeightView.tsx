"use client";

import React from "react";
import { WeightTracker } from "@/components/WeightTracker";
import { UserProfile } from "@/types";
import { Scale, HeartHandshake } from "lucide-react";

interface WeightViewProps {
  userProfile: UserProfile;
  onWeightUpdate?: (newWeight: number) => void;
}

export function WeightView({ userProfile, onWeightUpdate }: WeightViewProps) {
  return (
    <div className="space-y-4">
      {/* 1. Interactive Weight Tracker & BMI Chart */}
      <WeightTracker userProfile={userProfile} onWeightUpdate={onWeightUpdate} />

      {/* 2. Weight Mindset Tip */}
      <div className="rounded-3xl bg-emerald-50 p-4 border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
        <div className="flex items-center space-x-2 font-bold text-emerald-800 mb-1">
          <HeartHandshake className="h-4 w-4 text-emerald-600" />
          <span>เคล็ดลับการชั่งน้ำหนักที่แม่นยำ</span>
        </div>
        <p>
          ควรชั่งน้ำหนักในเวลาเดียวกันทุกวัน โดยเฉพาะ <strong>ตอนเช้าหลังตื่นนอนและเข้าห้องน้ำเรียบร้อย ก่อนรับประทานอาหารและน้ำ</strong> เพื่อให้ได้ค่าน้ำหนักจริงที่เที่ยงตรงที่สุดครับ
        </p>
      </div>
    </div>
  );
}
