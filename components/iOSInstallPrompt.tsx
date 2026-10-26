"use client";

import React, { useState, useEffect } from "react";
import { Share, PlusSquare, X, Smartphone, ArrowDown } from "lucide-react";

export function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. ตรวจสอบว่ากำลังเปิดในโหมด Standalone (Home Screen) หรือไม่
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isStandaloneMode);

    // 2. ตรวจสอบว่าเป็นอุปกรณ์ iOS (iPhone, iPad, iPod) หรือไม่
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    setIsIOS(isIOSDevice);

    // 3. ตรวจสอบประวัติการปิดแบนเนอร์
    const dismissed = localStorage.getItem("fitlife_ios_prompt_dismissed");
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("fitlife_ios_prompt_dismissed", "true");
  };

  // ถ้าเปิดในโหมด Standalone แล้ว หรือผู้ใช้กดปิด หรือไม่ใช่อุปกรณ์ iOS ไม่ต้องแสดง
  if (isStandalone || isDismissed || !isIOS) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 pb-8 transition-transform duration-300">
      <div className="mx-auto max-w-md rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/80 p-5 shadow-2xl text-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                ติดตั้ง FitLife Tracker บน iPhone
              </h3>
              <p className="text-xs text-gray-500">
                จำเป็นต้องเพิ่มลงหน้าจอโฮมเพื่อเปิดระบบแจ้งเตือน Web Push (iOS 16.4+)
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* วิธีการติดตั้ง 3 ขั้นตอนแบบ iOS Native */}
        <div className="mt-4 space-y-2.5 rounded-xl bg-gray-50/80 p-3 text-xs text-gray-700">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              1
            </span>
            <span>
              แตะปุ่มแชร์{" "}
              <Share className="inline-block h-4 w-4 mx-0.5 text-blue-600" /> ที่แถบเครื่องมือด้านล่าง
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              2
            </span>
            <span>
              เลื่อนลงมาแล้วเลือก{" "}
              <strong className="text-gray-900 font-semibold">
                &ldquo;เพิ่มไปยังหน้าจอโฮม&rdquo; (Add to Home Screen)
              </strong>
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
              3
            </span>
            <span>
              แตะปุ่ม <strong className="text-gray-900">&ldquo;เพิ่ม&rdquo; (Add)</strong> มุมขวาบน แล้วเปิดแอปผ่านหน้าจอโฮม
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center space-x-1 text-[11px] text-gray-400">
          <ArrowDown className="h-3 w-3 animate-bounce text-blue-600" />
          <span>กดปุ่มแชร์ด้านล่างเพื่อเริ่มติดตั้ง</span>
        </div>
      </div>
    </div>
  );
}
