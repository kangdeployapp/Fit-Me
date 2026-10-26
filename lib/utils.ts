import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UserProfile } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function calculateBMI(weightKg: number, heightCm: number = 170) {
  if (weightKg <= 0 || heightCm <= 0) return { bmi: 0, category: "-", color: "text-gray-500", bg: "bg-gray-50" };
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  if (bmi < 18.5) {
    return { bmi, category: "น้ำหนักน้อยกว่าเกณฑ์ (ผอม)", color: "text-blue-500", bg: "bg-blue-50" };
  } else if (bmi < 23.0) {
    return { bmi, category: "สมส่วน / สุขภาพดี", color: "text-emerald-500", bg: "bg-emerald-50" };
  } else if (bmi < 25.0) {
    return { bmi, category: "น้ำหนักเกิน (ท้วม)", color: "text-amber-500", bg: "bg-amber-50" };
  } else if (bmi < 30.0) {
    return { bmi, category: "โรคอ้วนระดับ 1", color: "text-orange-500", bg: "bg-orange-50" };
  } else {
    return { bmi, category: "โรคอ้วนอันตราย", color: "text-red-500", bg: "bg-red-50" };
  }
}

/**
 * คำนวณ BMR (Mifflin-St Jeor) และ TDEE เพื่อหาพลังงานที่ควรได้รับต่อวันสำหรับลดน้ำหนัก
 */
export function calculateEnergyMetrics(profile: Pick<UserProfile, "gender" | "age" | "heightCm" | "currentWeightKg" | "activityLevel">) {
  const { gender, age, heightCm, currentWeightKg, activityLevel } = profile;

  // Mifflin-St Jeor:
  // ชาย: (10 x W) + (6.25 x H) - (5 x A) + 5
  // หญิง: (10 x W) + (6.25 x H) - (5 x A) - 161
  let bmr = (10 * currentWeightKg) + (6.25 * heightCm) - (5 * age);
  if (gender === "male") {
    bmr += 5;
  } else {
    bmr -= 161;
  }
  bmr = Math.round(bmr);

  const multipliers: Record<UserProfile["activityLevel"], number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.2));
  // Calorie deficit 500 kcal สำหรับลดน้ำหนัก ~0.5 กก./สัปดาห์อย่างปลอดภัย
  const weightLossKcal = Math.max(1200, tdee - 500);

  return { bmr, tdee, weightLossKcal };
}

export function playChimeSound() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(1046.5, now, 0.4);       // C6
    playTone(1318.51, now + 0.15, 0.5); // E6
    playTone(1567.98, now + 0.3, 0.6);  // G6
    playTone(2093.0, now + 0.45, 1.0);  // C7
  } catch (err) {
    console.warn("Web Audio API sound playback failed:", err);
  }
}
