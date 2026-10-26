export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"      // ไม่ออกกำลังกาย / นั่งทำงานทั้งวัน
  | "light"          // ออกกำลังกายเบาๆ 1-3 วัน/สัปดาห์
  | "moderate"       // ออกกำลังกายปานกลาง 3-5 วัน/สัปดาห์
  | "active"         // ออกกำลังกายหนัก 6-7 วัน/สัปดาห์
  | "very_active";   // ออกกำลังกายหนักมาก / นักกีฬา

export interface UserProfile {
  id?: string;
  nickname: string;
  gender: Gender;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  dailyKcalTarget: number;
  dailyWaterMl: number;
  dailyStepGoal: number;
  updatedAt?: string;
}

export type MealCategory =
  | "high_protein"
  | "low_carb"
  | "low_calorie"
  | "quick_easy"
  | "plant_based";

export interface BreakfastMeal {
  id: string;
  name: string;
  category: MealCategory;
  categoryLabel: string;
  icon: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  tags: string[];
  description: string;
  cookingTimeMinutes: number;
  difficulty: "ง่ายมาก" | "ง่าย" | "ปานกลาง";
  highlights: string[];
}
