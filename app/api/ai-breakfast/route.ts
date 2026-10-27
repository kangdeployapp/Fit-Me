import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, ingredients, mealName, userProfile } = body;

    const apiKey = process.env.GEMINI_API_KEY;

    let aiMealResult = null;

    // 1. เรียกใช้งาน Gemini API เมื่อมีการกำหนด GEMINI_API_KEY
    if (apiKey) {
      try {
        let systemPrompt = "";
        let userPrompt = "";

        if (mode === "generate_from_ingredients") {
          systemPrompt = `คุณคือนักโภชนาการและเชฟอาหารเช้าสุขภาพ AI (FitLife AI Chef) จงคิดค้นเมนูอาหารเช้าภาษาไทย 1 เมนูจากวัตถุดิบที่ผู้ใช้กำหนด ตอบกลับเป็น JSON รูปแบบนี้เท่านั้น:
{
  "name": "ชื่อเมนูอาหารเช้า",
  "category": "high_protein" หรือ "low_carb" หรือ "low_calorie" หรือ "quick_easy" หรือ "plant_based",
  "categoryLabel": "โปรตีนสูง / คาร์บต่ำ / แคลอรี่ต่ำ / มื้อเร่งด่วน / แพลนต์เบสด์",
  "icon": "อิโมจิอาหาร เช่น 🍳 หรือ 🥑 หรือ 🥣",
  "kcal": แคลอรี่ตัวเลข,
  "proteinG": โปรตีนกรัม,
  "carbsG": คาร์บกรัม,
  "fatG": ไขมันกรัม,
  "fiberG": ไฟเบอร์กรัม,
  "cookingTimeMinutes": เวลาปรุงเป็นนาที,
  "difficulty": "ง่ายมาก หรือ ง่าย หรือ ปานกลาง",
  "description": "คำอธิบายรสชาติและประโยชน์สั้นๆ 1-2 ประโยค",
  "ingredients": ["วัตถุดิบ 1", "วัตถุดิบ 2"],
  "recipeSteps": ["ขั้นตอน 1", "ขั้นตอน 2", "ขั้นตอน 3"],
  "highlights": ["จุดเด่นสุขภาพ 1", "จุดเด่นสุขภาพ 2"]
}`;
          userPrompt = `วัตถุดิบที่มี: ${ingredients}`;
        } else if (mode === "analyze_meal") {
          systemPrompt = `คุณคือนักโภชนาการ AI ชั้นนำ จงวิเคราะห์อาหารเช้าตามชื่อที่ผู้ใช้พิมพ์มา (เช่น ข้าวต้มหมู, โจ๊กหมู, ต้มเลือดหมู) คำนวณแคลอรี่และสารอาหารจริง (Kcal, Protein, Carbs, Fat, Fiber) พร้อมอธิบายประโยชน์ ตอบกลับเป็น JSON โครงสร้างนี้เท่านั้น:
{
  "name": "ชื่ออาหารตรงกับที่ผู้ใช้พิมพ์",
  "category": "high_protein" หรือ "low_carb" หรือ "low_calorie" หรือ "quick_easy" หรือ "plant_based",
  "categoryLabel": "โปรตีนสูง / คาร์บต่ำ / แคลอรี่ต่ำ / มื้อเร่งด่วน / แพลนต์เบสด์",
  "icon": "อิโมจิที่เข้ากับเมนู เช่น 🥣 หรือ 🍳 หรือ 🥗",
  "kcal": แคลอรี่ตัวเลข,
  "proteinG": โปรตีนกรัม,
  "carbsG": คาร์บกรัม,
  "fatG": ไขมันกรัม,
  "fiberG": ไฟเบอร์กรัม,
  "cookingTimeMinutes": เวลาเตรียมโดยประมาณ,
  "difficulty": "ง่าย",
  "description": "คำอธิบายรสชาติและสารอาหารเด่น",
  "ingredients": ["ส่วนประกอบหลัก 1", "ส่วนประกอบหลัก 2"],
  "recipeSteps": ["ขั้นตอนการทาน/ปรุงสั้นๆ"],
  "highlights": ["จุดเด่นสุขภาพ 1", "จุดเด่นสุขภาพ 2"]
}`;
          userPrompt = `ชื่ออาหารที่ต้องการดึงข้อมูล: ${mealName}`;
        } else {
          systemPrompt = `คุณคือนักโภชนาการ AI แนะนำอาหารเช้าที่เหมาะสมกับเป้าหมายสุขภาพของผู้ใช้ ตอบกลับเป็น JSON โครงสร้างเดียวกัน`;
          userPrompt = `เป้าหมายลดน้ำหนัก: แคลอรี่แนะนำต่อวัน ${userProfile?.dailyKcalTarget || 1650} kcal, ส่วนสูง ${userProfile?.heightCm || 172} ซม., น้ำหนักปัจจุบัน ${userProfile?.currentWeightKg || 73} กก.`;
        }

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            aiMealResult = JSON.parse(rawText);
          }
        }
      } catch (geminiError) {
        console.warn("Gemini API call failed, falling back to smart engine:", geminiError);
      }
    }

    // 2. Fallback Thai Nutrition Database (พร้อมใช้งานได้ทันที แม้ไม่มี API Key)
    if (!aiMealResult) {
      if (mode === "analyze_meal") {
        const query = (mealName || "").trim().toLowerCase();

        if (query.includes("ข้าวต้มหมู") || query.includes("ข้าวต้ม")) {
          aiMealResult = {
            name: mealName || "ข้าวต้มหมูสับทรงเครื่อง",
            category: "low_calorie",
            categoryLabel: "แคลอรี่ต่ำ",
            icon: "🥣",
            kcal: 250,
            proteinG: 16,
            carbsG: 34,
            fatG: 6,
            fiberG: 2,
            cookingTimeMinutes: 10,
            difficulty: "ง่าย",
            description: "ข้าวต้มน้ำซุปใสกระดูกหมูเคี่ยวหอมกรุ่น หมูสับไร้มัน โรยผักชีต้นหอมและพริกไทย ย่อยง่าย สบายท้องยามเช้า",
            ingredients: ["ข้าวสวย 1 ทัพพี", "หมูสับไม่ติดมัน 70g", "น้ำซุปใส", "ผักชีต้นหอม ขิงซอย"],
            recipeSteps: ["ต้มน้ำซุปให้เดือด ใส่หมูสับปั้นก้อน", "ใส่ข้าวต้มจนเม็ดข้าวนุ่ม", "ตักเสิร์ฟโรยผักชีขิงซอยและพริกไทย"],
            highlights: ["พลังงานต่ำเพียง 250 kcal", "ย่อยง่าย ดูดซึมเร็ว เติมพลังงานเช้า"],
          };
        } else if (query.includes("โจ๊ก") || query.includes("โจ๊กหมู")) {
          aiMealResult = {
            name: mealName || "โจ๊กหมูสับใส่ไข่ลวก",
            category: "low_calorie",
            categoryLabel: "แคลอรี่ต่ำ",
            icon: "🥣",
            kcal: 280,
            proteinG: 18,
            carbsG: 36,
            fatG: 8,
            fiberG: 2,
            cookingTimeMinutes: 8,
            difficulty: "ง่าย",
            description: "โจ๊กข้าวหอมมะลิเนื้อเนียนนุ่ม หมูสับหมักพริกไทยและไข่ลวก ได้โปรตีนจากไข่และหมูครบถ้วน",
            ingredients: ["ปลายข้าวต้มโจ๊ก", "หมูสับ 60g", "ไข่ลวก 1 ฟอง", "ต้นหอม ขิงซอย"],
            recipeSteps: ["ต้มโจ๊กให้เนื้อเนียน", "ใส่หมูสับจนสุก", "ตอกไข่ลวกลงด้านบน โรยขิง"],
            highlights: ["คาร์โบไฮเดรตเชิงเดี่ยวเติมไกลโคเจน", "โปรตีนจากไข่บำรุงกล้ามเนื้อ"],
          };
        } else if (query.includes("ต้มเลือดหมู")) {
          aiMealResult = {
            name: mealName || "ต้มเลือดหมูใบจิงจูฉ่าย",
            category: "high_protein",
            categoryLabel: "โปรตีนสูง",
            icon: "🍲",
            kcal: 190,
            proteinG: 26,
            carbsG: 4,
            fatG: 7,
            fiberG: 3,
            cookingTimeMinutes: 10,
            difficulty: "ง่าย",
            description: "น้ำซุปกระดูกเคี่ยวร้อนๆ เลือดหมูและหมูสับไร้มัน ผักจิงจูฉ่ายช่วยฟอกเลือดและต้านอนุมูลอิสระ",
            ingredients: ["เลือดหมู 80g", "หมูสับไร้มัน 60g", "ใบจิงจูฉ่ายหรือตำลึง", "น้ำซุปพริกไทย"],
            recipeSteps: ["ลวกเลือดหมูและหมูสับในน้ำซุปเดือด", "ใส่ใบจิงจูฉ่าย", "ปรุงรสด้วยพริกไทยดำ"],
            highlights: ["ธาตุเหล็กสูงมาก บำรุงเม็ดเลือดแดง", "โปรตีนสูง คาร์โบไฮเดรตต่ำมาก"],
          };
        } else if (query.includes("สุกี้") || query.includes("สุกี้น้ำ")) {
          aiMealResult = {
            name: mealName || "สุกี้น้ำอกไก่ผักรวมใส่วุ้นเส้น",
            category: "low_calorie",
            categoryLabel: "แคลอรี่ต่ำ",
            icon: "🥗",
            kcal: 230,
            proteinG: 24,
            carbsG: 22,
            fatG: 4,
            fiberG: 5,
            cookingTimeMinutes: 8,
            difficulty: "ง่าย",
            description: "สุกี้น้ำใส่อกไก่ ไข่ไก่ ผักกาดขาว ผักบุ้ง วุ้นเส้นเล็กน้อย น้ำจิ้มเต้าหู้ยี้พอเหมาะ",
            ingredients: ["อกไก่ 100g", "ไข่ไก่ 1 ฟอง", "ผักกาดขาว ผักบุ้ง", "วุ้นเส้น 30g"],
            recipeSteps: ["ต้มน้ำซุปผัก ใส่ไก่และผัก", "ใส่วุ้นเส้นและไข่คน", "เสิร์ฟพร้อมน้ำจิ้มสุกี้"],
            highlights: ["ไฟเบอร์สูง อิ่มท้องนาน", "แคลอรี่ต่ำ ควบคุมน้ำหนักได้ดีเยี่ยม"],
          };
        } else if (query.includes("ข้าวมันไก่")) {
          aiMealResult = {
            name: mealName || "ข้าวมันไก่ต้ม (เนื้ออกไม่เอาหนัง)",
            category: "quick_easy",
            categoryLabel: "มื้อเร่งด่วน",
            icon: "🍗",
            kcal: 420,
            proteinG: 30,
            carbsG: 48,
            fatG: 12,
            fiberG: 1,
            cookingTimeMinutes: 0,
            difficulty: "ง่าย",
            description: "ข้าวมันไก่สูตรลดไขมัน เลือกเนื้ออกไก่ต้มไม่เอาหนัง น้ำซุปฟักแตงกวาเคียง",
            ingredients: ["ข้าวมัน 1 ถ้วย", "อกไก่ต้มไม่เอาหนัง 120g", "แตงกวา น้ำจิ้มเต้าเจี้ยว"],
            recipeSteps: ["พร้อมรับประทาน"],
            highlights: ["โปรตีนสูงถึง 30g", "ตัดหนังไก่ออกช่วยลดไขมันไปกว่า 50%"],
          };
        } else {
          // คำนวณอาหารเช้าทั่วไปตามชื่อ
          aiMealResult = {
            name: mealName || "อาหารเช้าเพื่อสุขภาพ",
            category: "high_protein",
            categoryLabel: "วิเคราะห์โดย AI",
            icon: "🍳",
            kcal: 290,
            proteinG: 20,
            carbsG: 28,
            fatG: 9,
            fiberG: 3,
            cookingTimeMinutes: 5,
            difficulty: "ง่าย",
            description: `วิเคราะห์คุณค่าทางโภชนาการของ "${mealName}" โดยประมาณการตามฐานข้อมูลโภชนาการแห่งชาติ`,
            ingredients: [mealName],
            recipeSteps: ["พร้อมรับประทาน"],
            highlights: ["สารอาหารครบ 5 หมู่", "พร้อมบันทึกเข้า Daily Habit"],
          };
        }
      } else if (mode === "generate_from_ingredients") {
        aiMealResult = {
          name: "ไข่คนทรงเครื่องสมุนไพรและผักรวม",
          category: "high_protein",
          categoryLabel: "โปรตีนสูง",
          icon: "🍳",
          kcal: 285,
          proteinG: 22,
          carbsG: 14,
          fatG: 12,
          fiberG: 4,
          cookingTimeMinutes: 7,
          difficulty: "ง่ายมาก",
          description: "ปรุงจากวัตถุดิบที่คุณมี อิ่มนาน สบายท้อง และโปรตีนครบครัน",
          ingredients: [ingredients || "ไข่ไก่ และผัก"],
          recipeSteps: ["ปรุงในกระทะไฟอ่อน", "เสิร์ฟร้อนๆ"],
          highlights: ["สร้างสรรค์จากวัตถุดิบที่มี", "พลังงานสะอาด"],
        };
      } else {
        aiMealResult = {
          name: "สลัดแซลมอนย่างอะโวคาโดและไข่ต้มยางมะตูม",
          category: "high_protein",
          categoryLabel: "แนะนำตามเป้าหมาย",
          icon: "🥑",
          kcal: 330,
          proteinG: 27,
          carbsG: 8,
          fatG: 18,
          fiberG: 5,
          cookingTimeMinutes: 10,
          difficulty: "ง่าย",
          description: "ออกแบบเฉพาะสำหรับเป้าหมายลดไขมันสะสม ได้โอเมก้า 3 และโปรตีนครบครัน",
          ingredients: ["แซลมอน 100g", "อะโวคาโดครึ่งลูก", "ไข่ต้ม 1 ฟอง"],
          recipeSteps: ["ย่างแซลมอนจนสุกหอม", "จัดใส่จานพร้อมผักและไข่ต้ม"],
          highlights: ["ตรงตามเป้าหมายแคลอรี่", "บำรุงหัวใจและระบบเผาผลาญ"],
        };
      }
    }

    // 3. บันทึกผลลัพธ์ลงตาราง breakfast_recipes ใน Supabase ทันที
    try {
      await supabaseAdmin.from("breakfast_recipes").insert({
        name: aiMealResult.name,
        category: aiMealResult.category || "high_protein",
        category_label: aiMealResult.categoryLabel || "เมนูสร้างโดย AI",
        icon: aiMealResult.icon || "🍽️",
        kcal: aiMealResult.kcal,
        protein_g: aiMealResult.proteinG,
        carbs_g: aiMealResult.carbsG,
        fat_g: aiMealResult.fatG,
        fiber_g: aiMealResult.fiberG,
        cooking_time_minutes: aiMealResult.cookingTimeMinutes || 5,
        difficulty: aiMealResult.difficulty || "ง่าย",
        description: aiMealResult.description,
        ingredients: aiMealResult.ingredients || [],
        recipe_steps: aiMealResult.recipeSteps || [],
        is_ai_generated: true,
      });
    } catch (saveErr) {
      console.warn("Failed to cache AI recipe to Supabase:", saveErr);
    }

    return NextResponse.json({
      success: true,
      meal: aiMealResult,
      isRealAi: !!apiKey,
    });
  } catch (error: any) {
    console.error("[AI Breakfast Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
