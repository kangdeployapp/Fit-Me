"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { urlBase64ToUint8Array } from "@/lib/utils";

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    // 1. ตรวจสอบว่า Browser รองรับ Service Worker และ PushManager หรือไม่
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);

    // 2. ตรวจสอบโหมด Standalone สำหรับ iOS
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (supported) {
      setPermission(Notification.permission);
      checkExistingSubscription();
    }
  }, []);

  // ตรวจสอบสถานะ Subscription ที่มีอยู่เดิมในเบราว์เซอร์
  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
    }
  };

  // ขอ Permission และลงทะเบียน Web Push Subscription
  const subscribeToPush = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // ตรวจสอบ VAPID Public Key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("ยังไม่ได้กำหนด NEXT_PUBLIC_VAPID_PUBLIC_KEY ใน Environment Variables");
      }

      // ขอสิทธิ์การแจ้งเตือนจากผู้ใช้
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        throw new Error("คุณปฏิเสธการอนุญาตแจ้งเตือน (Permission Denied)");
      }

      // ตรวจสอบและลงทะเบียน Service Worker
      let reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js");
      }
      await navigator.serviceWorker.ready;

      // ทำการ Subscribe ผ่าน PushManager
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey.buffer as ArrayBuffer,
      });

      // ดึง Subscription Keys (p256dh, auth) แปลงเป็น Base64
      const p256dhBuffer = subscription.getKey("p256dh");
      const authBuffer = subscription.getKey("auth");

      if (!p256dhBuffer || !authBuffer) {
        throw new Error("ไม่สามารถอ่านคีย์ความปลอดภัยจาก Push Subscription ได้");
      }

      const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhBuffer))));
      const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authBuffer))));

      // ส่งไปยัง Backend API เพื่อบันทึกลง Supabase
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: { p256dh, auth },
          userAgent: navigator.userAgent,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "บันทึกข้อมูลการแจ้งเตือนไม่สำเร็จ");
      }

      setIsSubscribed(true);
      setMessage({
        text: "เปิดการแจ้งเตือนสำเร็จแล้ว! ระบบจะแจ้งเตือนน้ำดื่มและอาหารเช้าทุกวัน",
        type: "success",
      });
    } catch (err: any) {
      console.error("Subscription error:", err);
      setMessage({
        text: err?.message || "เกิดข้อผิดพลาดในการเปิดการแจ้งเตือน",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ทดสอบยิง Push Notification ทันที
  const testPush = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/send-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🔔 ทดสอบแจ้งเตือน FitLife!",
          body: "ยินดีด้วยครับ! ระบบ Web Push บนอุปกรณ์ของคุณทำงานได้อย่างสมบูรณ์",
          url: "/",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "ส่งแจ้งเตือนทดสอบเรียบร้อยแล้ว!", type: "info" });
      } else {
        setMessage({ text: data.error || "เกิดข้อผิดพลาดในการทดสอบ", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: "ไม่สามารถส่งคำขอทดสอบได้", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200/60 text-amber-900 text-xs flex items-center space-x-2">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <span>อุปกรณ์หรือเบราว์เซอร์นี้ยังไม่รองรับ Web Push API</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-ios border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
              isSubscribed ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
            }`}
          >
            {isSubscribed ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              {isSubscribed ? "เปิดการแจ้งเตือนแล้ว" : "การแจ้งเตือนสุขภาพ (Web Push)"}
            </h4>
            <p className="text-xs text-gray-500">
              {isSubscribed
                ? "พร้อมรับการเตือนดื่มน้ำ & มื้ออาหารเช้า"
                : "รับแจ้งเตือนดื่มน้ำ คุมอาหาร และสรุปก้าวเดิน"}
            </p>
          </div>
        </div>

        <div>
          {!isSubscribed ? (
            <button
              onClick={subscribeToPush}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700 active:scale-95 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>กำลังเปิด...</span>
                </>
              ) : (
                <>
                  <Bell className="h-3.5 w-3.5" />
                  <span>เปิดรับแจ้งเตือน</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={testPush}
              disabled={isLoading}
              className="inline-flex items-center space-x-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 active:scale-95 transition disabled:opacity-50"
            >
              <BellRing className="h-3 w-3 text-blue-600" />
              <span>ทดสอบส่ง</span>
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mt-3 rounded-xl p-2.5 text-xs flex items-center space-x-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : message.type === "error"
              ? "bg-red-50 text-red-800"
              : "bg-blue-50 text-blue-800"
          }`}
        >
          {message.type === "success" && <CheckCircle className="h-4 w-4 text-emerald-600" />}
          {message.type === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
          {message.type === "info" && <BellRing className="h-4 w-4 text-blue-600" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
