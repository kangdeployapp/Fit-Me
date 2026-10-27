"use client";

import React, { useState } from "react";
import { Sparkles, RefreshCw, ShieldCheck, HeartHandshake } from "lucide-react";
import { MotivationalQuote, getRandomQuote, MOTIVATIONAL_QUOTES } from "@/data/motivationalQuotes";

export function MotivationalCard() {
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote>(() => getRandomQuote());

  const handleShuffle = () => {
    let next = getRandomQuote();
    while (next.id === currentQuote.id && MOTIVATIONAL_QUOTES.length > 1) {
      next = getRandomQuote();
    }
    setCurrentQuote(next);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 p-5 text-white shadow-ios">
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-xs">
              {currentQuote.emoji}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
              {currentQuote.badge}
            </span>
          </div>

          <button
            onClick={handleShuffle}
            className="flex items-center space-x-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/30 active:scale-95 transition"
            title="เปลี่ยนข้อความให้กำลังใจ"
          >
            <RefreshCw className="h-3 w-3" />
            <span>เปลี่ยนข้อความ</span>
          </button>
        </div>

        <div className="mt-3">
          <h3 className="text-base font-bold leading-snug drop-shadow-sm">
            {currentQuote.title}
          </h3>
          <p className="mt-1.5 text-xs text-rose-50 leading-relaxed font-normal">
            &ldquo;{currentQuote.body}&rdquo;
          </p>
        </div>

        {/* ระบบแจ้งเตือนอัตโนมัติทำงานในพื้นหลัง (ไม่ต้องกดส่งเอง) */}
        <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-[11px]">
          <span className="text-rose-100 flex items-center space-x-1">
            <HeartHandshake className="h-3.5 w-3.5" />
            <span>FitLife ส่งพลังบวกให้คุณทุกวัน</span>
          </span>

          <span className="inline-flex items-center space-x-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-ping" />
            <span>ระบบแจ้งเตือนอัตโนมัติทำงานอยู่</span>
          </span>
        </div>
      </div>
    </div>
  );
}
