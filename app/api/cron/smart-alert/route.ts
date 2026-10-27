import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { webpush } from "@/lib/webpush";

export async function GET(req: NextRequest) {
  return handleSmartAlert(req);
}

export async function POST(req: NextRequest) {
  return handleSmartAlert(req);
}

async function handleSmartAlert(req: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    // คำนวณเวลาท้องถิ่นประเทศไทย (UTC+7)
    const nowUtc = new Date();
    const thaiHour = (nowUtc.getUTCHours() + 7) % 24;
    const thaiMinute = nowUtc.getUTCMinutes();
    const currentDecimalHour = thaiHour + thaiMinute / 60;

    // 1. ดึงข้อมูล User Profile
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nickname = profile?.nickname || "คุณคนเก่ง";
    const waterTarget = profile?.daily_water_ml || 2500;
    const stepTarget = profile?.daily_step_goal || 10000;

    // 2. ดึงสถานะกิจกรรมจริงของวันนี้จาก daily_habits
    const { data: todayHabit } = await supabaseAdmin
      .from("daily_habits")
      .select("*")
      .eq("date", todayStr)
      .maybeSingle();

    const currentWater = todayHabit?.water_ml || 0;
    const currentSteps = todayHabit?.steps || 0;
    const currentBreakfast = todayHabit?.breakfast_meal || null;

    // 3. ดึงประวัติการแจ้งเตือนที่เคยส่งไปแล้วในวันนี้
    const { data: sentLogs } = await supabaseAdmin
      .from("notification_logs")
      .select("alert_type")
      .eq("sent_date", todayStr);

    const alreadySentTypes = new Set((sentLogs || []).map((l) => l.alert_type));

    let alertToSend: { type: string; title: string; body: string } | null = null;

    // ==============================================================
    // กฎประเมินสถานะอัตโนมัติ (Automated Decision Rules)
    // ==============================================================

    // กฎที่ 1: ตรวจสอบมื้อเช้า (เวลา 07:00 - 10:30 น.)
    if (currentDecimalHour >= 7 && currentDecimalHour <= 10.5) {
      if (!currentBreakfast && !alreadySentTypes.has("breakfast_missing")) {
        alertToSend = {
          type: "breakfast_missing",
          title: "🍳 เริ่มต้นวันด้วยมื้อเช้าสุขภาพดี!",
          body: `สวัสดีครับ${nickname} เช้านี้ยังไม่ได้บันทึกมื้อเช้าเลย แวะมาเลือกเมนูโปรตีนสูงเพื่อคงระดับน้ำตาลในเลือดกันครับ!`,
        };
      }
    }

    // กฎที่ 2: ตรวจสอบปริมาณน้ำดื่ม (เวลา 11:30 - 16:00 น.)
    if (!alertToSend && currentDecimalHour >= 11.5 && currentDecimalHour <= 16.0) {
      const expectedWaterByNow = waterTarget * 0.5; // ควรได้อย่างน้อยครึ่งหนึ่ง
      if (currentWater < expectedWaterByNow && !alreadySentTypes.has("water_behind")) {
        alertToSend = {
          type: "water_behind",
          title: "💧 ได้เวลาเติมความสดชื่นแล้วครับ!",
          body: `บ่ายนี้${nickname}ดื่มน้ำไปแล้ว ${currentWater.toLocaleString()} มล. (จากเป้า ${waterTarget.toLocaleString()} มล.) ดื่มน้ำสักแก้วเพื่อกระตุ้นการเผาผลาญกันครับ`,
        };
      }
    }

    // กฎที่ 3: ตรวจสอบก้าวเดิน (เวลา 16:30 - 19:30 น.)
    if (!alertToSend && currentDecimalHour >= 16.5 && currentDecimalHour <= 19.5) {
      if (currentSteps < stepTarget * 0.7 && !alreadySentTypes.has("steps_deficit")) {
        const remainingSteps = Math.max(0, stepTarget - currentSteps);
        alertToSend = {
          type: "steps_deficit",
          title: "🚶‍♂️ ขยับตัวอีกนิดเพื่อพิชิตเป้าหมาย!",
          body: `วันนี้เดินไปแล้ว ${currentSteps.toLocaleString()} ก้าว ขาดอีกเพียง ${remainingSteps.toLocaleString()} ก้าว ลองเดินเร็วสัก 15 นาที สุขภาพหัวใจจะแข็งแรงขึ้นครับ!`,
        };
      }
    }

    // กฎที่ 4: สรุปผลความสำเร็จประจำวัน & ให้กำลังใจ (เวลา 20:00 - 22:30 น.)
    if (!alertToSend && currentDecimalHour >= 20.0 && currentDecimalHour <= 22.5) {
      if (!alreadySentTypes.has("evening_summary")) {
        alertToSend = {
          type: "evening_summary",
          title: "🌟 ขอบคุณในความพยายามวันนี้!",
          body: `วันนี้${nickname}เดินได้ ${currentSteps.toLocaleString()} ก้าว และดื่มน้ำ ${currentWater.toLocaleString()} มล. ร่างกายกำลังตอบแทนความตั้งใจของคุณ พักผ่อนให้เต็มที่นะครับ!`,
        };
      }
    }

    // ถ้าไม่มีเงื่อนไขที่ต้องแจ้งเตือน หรือแจ้งไปครบแล้ว
    if (!alertToSend) {
      return NextResponse.json({
        success: true,
        message: "ระบบตรวจสอบสถานะปัจจุบันแล้ว: ยังไม่มีเงื่อนไขที่ต้องส่งแจ้งเตือนเพิ่มในรอบนี้",
        currentTimeThai: `${thaiHour}:${thaiMinute < 10 ? "0" : ""}${thaiMinute} น.`,
        currentHabits: { water: currentWater, steps: currentSteps, breakfast: currentBreakfast },
        alreadySentToday: Array.from(alreadySentTypes),
      });
    }

    // 4. ดึง Push Subscriptions ทั้งหมดจาก Supabase
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*");

    if (subError || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: "ไม่มีอุปกรณ์ที่ลงทะเบียนรับแจ้งเตือนในระบบ",
      });
    }

    // 5. ส่ง Web Push ไปยังเครื่องผู้ใช้อัตโนมัติ
    const payload = JSON.stringify({
      title: alertToSend.title,
      body: alertToSend.body,
      url: "/",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
    });

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          }
          throw err;
        }
      })
    );

    // 6. บันทึก Notification Log เพื่อไม่ให้ส่งซ้ำในวันเดียวกัน
    await supabaseAdmin.from("notification_logs").insert({
      alert_type: alertToSend.type,
      sent_date: todayStr,
      payload: alertToSend,
    });

    const successful = results.filter((r) => r.status === "fulfilled").length;

    return NextResponse.json({
      success: true,
      sentAlert: alertToSend,
      deliveredToDevices: successful,
      currentTimeThai: `${thaiHour}:${thaiMinute < 10 ? "0" : ""}${thaiMinute} น.`,
    });
  } catch (error: any) {
    console.error("[SmartAlert Cron Error]:", error);
    return NextResponse.json({ error: error?.message || "Unknown error" }, { status: 500 });
  }
}
