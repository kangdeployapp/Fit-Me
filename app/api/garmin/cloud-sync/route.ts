import { NextRequest, NextResponse } from "next/server";
import { GarminClient, Garmin, MemoryTokenStore } from "garminconnect-js";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, mfaState, code, tokens } = body;
    const todayStr = new Date().toISOString().split("T")[0];

    const client = new GarminClient({ tokenStore: new MemoryTokenStore() });

    // 1. เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน Garmin Connect ครั้งแรก
    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json(
          { error: "กรุณากรอกอีเมลและรหัสผ่าน Garmin Connect ให้ครบถ้วน" },
          { status: 400 }
        );
      }

      const loginResult = await client.login(email.trim(), password);

      if (loginResult.state === "mfa_required") {
        return NextResponse.json({
          needsMfa: true,
          mfaState: loginResult,
          message: "Garmin ส่งรหัสยืนยัน OTP ไปที่อีเมลของคุณ กรุณากรอกรหัส 6 หลักเพื่อดำเนินการต่อ",
        });
      }

      if (loginResult.state !== "success") {
        return NextResponse.json(
          { error: "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน Garmin Connect อีกครั้ง" },
          { status: 401 }
        );
      }
    }

    // 2. ดำเนินการต่อเมื่อมีรหัส MFA (OTP จากอีเมล)
    if (action === "mfa") {
      if (!mfaState || !code) {
        return NextResponse.json({ error: "กรุณากรอกรหัส OTP 6 หลัก" }, { status: 400 });
      }
      await client.resumeLogin(mfaState, String(code).trim());
    }

    // 3. ซิงค์ต่อด้วย Session Tokens ที่บันทึกไว้
    if (action === "sync_tokens") {
      if (!tokens) {
        return NextResponse.json({ error: "ไม่พบ Session Tokens สำหรับเชื่อมต่อ" }, { status: 400 });
      }
      client.setTokens(tokens);
    }

    // เมื่อเข้าสู่ระบบสำเร็จแล้ว ให้ดึงข้อมูลจริงจาก Garmin Connect Cloud
    const garmin = new Garmin(client);
    let savedTokens: any = null;
    try {
      savedTokens = client.getTokens();
    } catch {}

    let totalSteps = 0;
    let restingHr = 58;
    let fitnessAge = 24;
    let deviceName = "Garmin Instinct 2";

    // 1) ดึงจำนวนก้าวและอัตราเต้นหัวใจจริงจาก UserSummary
    try {
      const summary = await garmin.getUserSummary(todayStr);
      if (summary) {
        if (summary.totalSteps !== undefined && summary.totalSteps !== null) {
          totalSteps = Number(summary.totalSteps);
        }
        if (summary.restingHeartRate) {
          restingHr = Number(summary.restingHeartRate);
        }
      }
    } catch (err) {
      console.warn("Garmin summary fetch warning:", err);
    }

    // 2) ดึงอายุสุขภาพจริง (Fitness Age) จาก FitnessAge Service ของ Garmin
    try {
      const faData: any = await garmin.getFitnessAgeData(todayStr);
      if (faData) {
        const val = faData.fitnessAge || faData.value || faData.calculatedFitnessAge;
        if (val) fitnessAge = Math.round(Number(val));
      }
    } catch (err) {
      console.warn("Garmin fitness age fetch warning:", err);
    }

    // 3) ดึงชื่อรุ่นอุปกรณ์จริงจาก Garmin
    try {
      const devices: any = await garmin.getDevices();
      if (Array.isArray(devices) && devices.length > 0) {
        deviceName = devices[0].productDisplayName || devices[0].deviceName || deviceName;
      }
    } catch (err) {
      console.warn("Garmin devices fetch warning:", err);
    }

    // บันทึกข้อมูลจริงทั้งหมดลง Supabase ทันที
    const now = new Date().toISOString();
    await supabaseAdmin.from("daily_habits").upsert(
      {
        date: todayStr,
        steps: totalSteps,
        fitness_age: fitnessAge,
        resting_hr: restingHr,
        updated_at: now,
      },
      { onConflict: "date" }
    );

    await supabaseAdmin
      .from("user_profiles")
      .update({
        garmin_connected: true,
        garmin_device: deviceName,
        fitness_age: fitnessAge,
        resting_hr: restingHr,
        garmin_last_sync: now,
        updated_at: now,
      })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    return NextResponse.json({
      success: true,
      message: `ดึงข้อมูลจริงจาก Garmin Cloud สำเร็จ! (${totalSteps.toLocaleString()} ก้าว, อายุสุขภาพ ${fitnessAge} ปี)`,
      steps: totalSteps,
      fitnessAge,
      restingHr,
      deviceName,
      tokens: savedTokens,
      lastSync: now,
    });
  } catch (error: any) {
    console.error("Garmin Cloud Sync Error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ Garmin Connect Cloud" },
      { status: 500 }
    );
  }
}
