import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys, userAgent } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: "ข้อมูล Subscription ไม่ครบถ้วน (ต้องมี endpoint, p256dh, auth)" },
        { status: 400 }
      );
    }

    const { p256dh, auth } = keys;

    // บันทึกหรืออัปเดต (Upsert) ลงฐานข้อมูล Supabase ตาม endpoint
    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          endpoint,
          p256dh,
          auth,
          user_agent: userAgent || req.headers.get("user-agent") || "unknown",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      )
      .select();

    if (error) {
      console.error("[API Subscribe] Supabase Error:", error);
      return NextResponse.json(
        { error: "ไม่สามารถบันทึก Subscription ลงฐานข้อมูลได้", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "บันทึก Push Subscription สำเร็จ",
        record: data?.[0] || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[API Subscribe] Exception:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
