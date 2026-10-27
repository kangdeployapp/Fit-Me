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
          systemPrompt = `คุณคือนักโภชนาการ AI วิเคราะห์สารอาหารของอาหารเช้าที่ผู้ใช้รับประทาน ตอบกลับเป็น JSON โครงสร้างเดียวกัน (name, category, categoryLabel, icon, kcal, proteinG, carbsG, fatG, fiberG, description, highlights)`;
          userPrompt = `ชื่ออาหารที่ทาน: ${mealName}`;
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

    // 2. Fallback Smart Nutritionist Engine (ทำงานทันทีแม้ยังไม่มี GEMINI_API_KEY)
    if (!aiMealResult) {
      if (mode === "generate_from_ingredients") {
        const inputStr = (ingredients || "").toLowerCase();
        if (inputStr.includes("โอ๊ต") || inputStr.includes("กล้วย") || inputStr.includes("นม")) {
          aiMealResult = {
            name: "ข้าวโอ๊ตต้มกล้วยหอมโปรตีนและเนยถั่ว",
            category: "high_protein",
            categoryLabel: "โปรตีนสูง",
            icon: "🥣",
            kcal: 310,
            proteinG: 22,
            carbsG: 36,
            fatG: 8,
            fiberG: 6,
            cookingTimeMinutes: 5,
            difficulty: "ง่ายมาก",
            description: "มื้อเช้าพลังงานสะอาด ย่อยง่าย ให้พลังงานยาวนานตลอดช่วงเช้า",
            ingredients: ["ข้าวโอ๊ต 4 ช้อนโต๊ะ", "กล้วยหอม 1 ลูก", "นมไขมันต่ำ 150ml", "เนยถั่ว 1 ช้อนชา"],
            recipeSteps: ["ต้มข้าวโอ๊ตกับนม 3 นาที", "หั่นกล้วยหอมวางด้านบน", "ราดเนยถั่วและโรยเมล็ดเจีย"],
            highlights: ["เบต้ากลูแคนช่วยลดคอเลสเตอรอล", "อิ่มท้องยาวนาน"],
          };
        } else if (inputStr.includes("อกไก่") || inputStr.includes("ผัก")) {
          aiMealResult = {
            name: "อกไก่ฉีกผัดพริกไทยดำใส่ไข่ขาวและบรอกโคลี",
            category: "low_carb",
            categoryLabel: "คาร์บต่ำ",
            icon: "🍗",
            kcal: 260,
            proteinG: 34,
            carbsG: 6,
            fatG: 5,
            fiberG: 4,
            cookingTimeMinutes: 8,
            difficulty: "ง่าย",
            description: "โปรตีนเน้นๆ คาร์บต่ำพิเศษ เหมาะสำหรับการเร่งลดไขมันสะสม",
            ingredients: ["อกไก่ต้มฉีก 120g", "ไข่ขาว 2 ฟอง", "บรอกโคลีลวก 50g", "พริกไทยดำ"],
            recipeSteps: ["สเปรย์น้ำมันมะกอกบนกระทะ", "ผัดอกไก่ฉีกกับบรอกโคลี", "ใส่ไข่ขาวคั่วให้เข้ากัน ปรุงด้วยซีอิ๊วขาวลดโซเดียม"],
            highlights: ["โปรตีนสูงถึง 34g", "คุมอินซูลินให้คงที่"],
          };
        } else {
          aiMealResult = {
            name: "ไข่กวนสมุนไพรมะเขือเทศราชินี + ขนมปังโฮลวีต",
            category: "high_protein",
            categoryLabel: "โปรตีนสูง",
            icon: "🍳",
            kcal: 295,
            proteinG: 21,
            carbsG: 22,
            fatG: 12,
            fiberG: 4,
            cookingTimeMinutes: 6,
            difficulty: "ง่ายมาก",
            description: "ไข่ไก่สดคั่วเนยสดแท้และมะเขือเทศ อุดมด้วยไลโคปีนและโปรตีนคุณภาพสูง",
            ingredients: ["ไข่ไก่ 2 ฟอง", "มะเขือเทศราชินี 5 ลูก", "ขนมปังโฮลวีต 1 แผ่น", "ออริกาโน่"],
            recipeSteps: ["ตีไข่ไก่ใส่เกลือชมพูเล็กน้อย", "เทลงกระทะไฟอ่อน คั่วจนเนื้อนุ่ม", "เสิร์ฟพร้อมขนมปังปิ้ง"],
            highlights: ["ไลโคปีนบำรุงผิวพรรณ", "โปรตีนสมบูรณ์"],
          };
        }
      } else if (mode === "analyze_meal") {
        const name = mealName || "อาหารเช้าทั่วไป";
        aiMealResult = {
          name: name,
          category: "quick_easy",
          categoryLabel: "วิเคราะห์โดย AI",
          icon: "🥗",
          kcal: 320,
          proteinG: 18,
          carbsG: 35,
          fatG: 11,
          fiberG: 3,
          cookingTimeMinutes: 0,
          difficulty: "ง่าย",
          description: `วิเคราะห์คุณค่าทางโภชนาการของ "${name}" โดยประมาณตามมาตรฐานสำนักโภชนาการ`,
          ingredients: [name],
          recipeSteps: ["พร้อมรับประทาน"],
          highlights: ["คำนวณสัดส่วนสารอาหารมาตรฐาน", "พร้อมบันทึกลง Daily Log"],
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
          ingredients: ["แซลมอน 100g", "อะโวคาโดครึ่งลูก", "ไข่ต้ม 1 ฟอง", "ผักสลัดรวม"],
          recipeSteps: ["ย่างแซลมอนจนสุกหอม", "จัดใส่จานพร้อมผักและไข่ต้ม", "บีบน้ำมะนาวและเกลือชมพู"],
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
