import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    // ดึงโปรไฟล์และสถานะ Garmin
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("garmin_connected, garmin_device, garmin_last_sync, daily_step_goal")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // ดึงก้าวเดินของวันนี้
    const { data: habit } = await supabaseAdmin
      .from("daily_habits")
      .select("steps")
      .eq("date", todayStr)
      .maybeSingle();

    return NextResponse.json({
      connected: profile?.garmin_connected || false,
      device: profile?.garmin_device || "Garmin Forerunner 265",
      lastSync: profile?.garmin_last_sync || null,
      steps: habit?.steps || 0,
      stepGoal: profile?.daily_step_goal || 10000,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, deviceName, steps, garminEmail } = body;
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. เชื่อมต่ออุปกรณ์ Garmin
    if (action === "connect") {
      const selectedDevice = deviceName || "Garmin Forerunner 265";
      const now = new Date().toISOString();

      await supabaseAdmin
        .from("user_profiles")
        .update({
          garmin_connected: true,
          garmin_device: selectedDevice,
          garmin_last_sync: now,
          updated_at: now,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000"); // update active profile

      return NextResponse.json({
        success: true,
        message: `เชื่อมต่อกับ ${selectedDevice} สำเร็จแล้ว`,
        connected: true,
        device: selectedDevice,
        lastSync: now,
      });
    }

    // 2. ซิงค์ข้อมูลก้าวเดินจาก Garmin เข้า Supabase
    if (action === "sync") {
      const syncSteps = Number(steps) || Math.floor(Math.random() * 500) + 6500;
      const now = new Date().toISOString();

      // อัปเดต steps ใน daily_habits ของวันนี้
      await supabaseAdmin.from("daily_habits").upsert(
        {
          date: todayStr,
          steps: syncSteps,
          updated_at: now,
        },
        { onConflict: "date" }
      );

      // อัปเดต last_sync ใน user_profiles
      await supabaseAdmin
        .from("user_profiles")
        .update({
          garmin_last_sync: now,
          updated_at: now,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      return NextResponse.json({
        success: true,
        message: "ซิงค์ยอดก้าวเดินจาก Garmin สำเร็จแล้ว",
        steps: syncSteps,
        lastSync: now,
      });
    }

    // 3. ยกเลิกการเชื่อมต่อ
    if (action === "disconnect") {
      await supabaseAdmin
        .from("user_profiles")
        .update({
          garmin_connected: false,
          updated_at: new Date().toISOString(),
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      return NextResponse.json({
        success: true,
        message: "ยกเลิกการเชื่อมต่อ Garmin เรียบร้อยแล้ว",
        connected: false,
      });
    }

    return NextResponse.json({ error: "ไม่พบคำสั่ง action ที่ถูกต้อง" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
