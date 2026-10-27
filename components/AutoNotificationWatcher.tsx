"use client";

import { useEffect } from "react";

/**
 * AutoNotificationWatcher
 * ตรวจสอบสถานะกิจกรรมจริง (น้ำ, ก้าวเดิน, อาหารเช้า) อัตโนมัติทุก 30 นาทีในพื้นหลัง
 * โดยไม่ต้องให้ผู้ใช้กดส่งเอง
 */
export function AutoNotificationWatcher() {
  useEffect(() => {
    // ฟังก์ชันยิงเช็คเงื่อนไขอัตโนมัติไปยัง API Backend
    const checkSmartAlert = async () => {
      try {
        await fetch("/api/cron/smart-alert", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });
      } catch (err) {
        // เงียบไว้ใน background
      }
    };

    // เช็คครั้งแรกเมื่อเปิดแอป (หลังจากรอ 5 วินาทีเพื่อให้แอปโหลดเสร็จก่อน)
    const initialTimer = setTimeout(() => {
      checkSmartAlert();
    }, 5000);

    // ตรวจสอบสถานะซ้ำทุกๆ 30 นาที (1800000 ms)
    const interval = setInterval(() => {
      checkSmartAlert();
    }, 1800000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  return null;
}
