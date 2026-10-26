import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { webpush } from "@/lib/webpush";
import { getRandomQuote } from "@/data/motivationalQuotes";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title, body: pushBody, url, type, category } = body;

    // กำหนดข้อความแจ้งเตือนตาม Type หรือค่าที่ส่งมา
    let payloadTitle = title;
    let payloadBody = pushBody;
    let payloadUrl = url || "/";

    if (!payloadTitle || !payloadBody) {
      if (type === "motivate") {
        const quote = getRandomQuote(category);
        payloadTitle = quote.title;
        payloadBody = quote.body;
      } else if (type === "water") {
        const quote = getRandomQuote("water");
        payloadTitle = quote.title;
        payloadBody = quote.body;
      } else if (type === "breakfast") {
        const quote = getRandomQuote("breakfast");
        payloadTitle = quote.title;
        payloadBody = quote.body;
      } else if (type === "steps") {
        const quote = getRandomQuote("steps");
        payloadTitle = quote.title;
        payloadBody = quote.body;
      } else if (type === "walk_done") {
        payloadTitle = "🎉 ยอดเยี่ยมมาก! เดินครบกำหนดเวลาแล้ว";
        payloadBody = "คุณได้เผาผลาญพลังงานและขยับเข้าใกล้เป้าหมายสุขภาพอีกก้าวหนึ่งแล้วครับ!";
      } else {
        payloadTitle = "✨ FitLife Tracker ขอส่งกำลังใจให้คุณ!";
        payloadBody = "ทุกความพยายามเล็กๆ ในวันนี้ จะเปลี่ยนเป็นผลลัพธ์สุขภาพที่ยิ่งใหญ่ในวันพรุ่งนี้ครับ";
      }
    }

    const payload = JSON.stringify({
      title: payloadTitle,
      body: payloadBody,
      url: payloadUrl,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
    });

    // 1. ดึง Push Subscriptions ทั้งหมดจาก Supabase
    const { data: subscriptions, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*");

    if (error) {
      console.error("[Send-Push] Fetch error:", error);
      return NextResponse.json({ error: "ไม่สามารถดึงข้อมูล Subscriptions ได้" }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { message: "ไม่มีอุปกรณ์ที่ลงทะเบียนในระบบ", count: 0 },
        { status: 200 }
      );
    }

    // 2. ส่ง Web Push ไปยังทุกอุปกรณ์
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          return { status: "fulfilled", id: sub.id, endpoint: sub.endpoint };
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[Send-Push] Removing expired endpoint: ${sub.endpoint}`);
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          }
          throw err;
        }
      })
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      success: true,
      message: `ส่งการแจ้งเตือนสำเร็จ ${successful} เครื่อง (ล้มเหลว/หมดอายุ ${failed} เครื่อง)`,
      title: payloadTitle,
      body: payloadBody,
      total: subscriptions.length,
      successful,
      failed,
    });
  } catch (error: any) {
    console.error("[Send-Push] Exception:", error);
    return NextResponse.json(
      { error: "ส่งการแจ้งเตือนไม่สำเร็จ", details: error.message },
      { status: 500 }
    );
  }
}

// รองรับ GET สำหรับ Vercel Cron
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "motivate";
  return POST(
    new NextRequest(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({ type }),
    })
  );
}
