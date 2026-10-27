import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const { searchParams } = new URL(req.url);
    const querySteps = searchParams.get("steps");
    const queryFitnessAge = searchParams.get("fitnessAge");
    const queryRestingHr = searchParams.get("restingHr");

    // ถ้ามีการส่ง query parameters เช่น ?steps=8500 จาก iOS Shortcuts
    if (querySteps !== null) {
      const syncSteps = Number(querySteps) || 0;
      const syncFitnessAge = queryFitnessAge !== null ? Number(queryFitnessAge) : 24;
      const syncRestingHr = queryRestingHr !== null ? Number(queryRestingHr) : 58;
      const now = new Date().toISOString();

      await supabaseAdmin.from("daily_habits").upsert(
        {
          date: todayStr,
          steps: syncSteps,
          fitness_age: syncFitnessAge,
          resting_hr: syncRestingHr,
          updated_at: now,
        },
        { onConflict: "date" }
      );

      await supabaseAdmin
        .from("user_profiles")
        .update({
          fitness_age: syncFitnessAge,
          resting_hr: syncRestingHr,
          garmin_last_sync: now,
          updated_at: now,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      return NextResponse.json({
        success: true,
        message: `ซิงค์ก้าวเดินจริง ${syncSteps.toLocaleString()} ก้าวจาก iOS Shortcut สำเร็จแล้ว`,
        steps: syncSteps,
        fitnessAge: syncFitnessAge,
        lastSync: now,
      });
    }

    // กรณีเรียก GET ปกติ เพื่ออ่านสถานะ
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("age, garmin_connected, garmin_device, garmin_last_sync, daily_step_goal, fitness_age, resting_hr")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // ดึงก้าวเดินของวันนี้
    const { data: habit } = await supabaseAdmin
      .from("daily_habits")
      .select("steps, fitness_age, resting_hr")
      .eq("date", todayStr)
      .maybeSingle();

    return NextResponse.json({
      connected: profile?.garmin_connected || false,
      device: profile?.garmin_device || "Garmin Instinct 2",
      lastSync: profile?.garmin_last_sync || null,
      steps: habit?.steps || 0,
      stepGoal: profile?.daily_step_goal || 10000,
      actualAge: profile?.age || 39,
      fitnessAge: habit?.fitness_age || profile?.fitness_age || 24,
      restingHr: habit?.resting_hr || profile?.resting_hr || 58,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // กรณีส่ง payload ไม่ใช่ json
      body = {};
    }

    const action = body.action || (body.steps !== undefined ? "sync" : "connect");
    const { deviceName, steps, fitnessAge, restingHr } = body;
    const todayStr = new Date().toISOString().split("T")[0];

    // 1. เชื่อมต่ออุปกรณ์ Garmin
    if (action === "connect") {
      const selectedDevice = deviceName || "Garmin Instinct 2";
      const now = new Date().toISOString();

      await supabaseAdmin
        .from("user_profiles")
        .update({
          garmin_connected: true,
          garmin_device: selectedDevice,
          garmin_last_sync: now,
          updated_at: now,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      return NextResponse.json({
        success: true,
        message: `เชื่อมต่อกับ ${selectedDevice} สำเร็จแล้ว`,
        connected: true,
        device: selectedDevice,
        lastSync: now,
      });
    }

    // 2. ซิงค์ข้อมูลก้าวเดิน และ อายุสุขภาพ (Fitness Age) จาก Garmin Connect / iOS Shortcut
    if (action === "sync" || steps !== undefined) {
      const syncSteps = Number(steps) || 0;
      const syncFitnessAge = fitnessAge !== undefined ? Number(fitnessAge) : 24;
      const syncRestingHr = restingHr !== undefined ? Number(restingHr) : 58;
      const now = new Date().toISOString();

      // บันทึก steps และ fitness_age ใน daily_habits
      await supabaseAdmin.from("daily_habits").upsert(
        {
          date: todayStr,
          steps: syncSteps,
          fitness_age: syncFitnessAge,
          resting_hr: syncRestingHr,
          updated_at: now,
        },
        { onConflict: "date" }
      );

      // บันทึก fitness_age ใน user_profiles
      await supabaseAdmin
        .from("user_profiles")
        .update({
          fitness_age: syncFitnessAge,
          resting_hr: syncRestingHr,
          garmin_last_sync: now,
          updated_at: now,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      return NextResponse.json({
        success: true,
        message: "ซิงค์ก้าวเดินและอายุสุขภาพจาก Garmin สำเร็จแล้ว",
        steps: syncSteps,
        fitnessAge: syncFitnessAge,
        restingHr: syncRestingHr,
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
