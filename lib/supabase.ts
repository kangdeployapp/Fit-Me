import { createClient } from "@supabase/supabase-js";
import { UserProfile } from "@/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRole || supabaseAnonKey
);

export type PushSubscriptionRecord = {
  id?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
};

export type WeightLog = {
  id?: string;
  weight: number;
  logged_date: string;
  note?: string;
  created_at?: string;
};

export type DailyHabit = {
  id?: string;
  date: string;
  steps: number;
  water_ml: number;
  breakfast_meal: string | null;
  breakfast_kcal: number;
  created_at?: string;
  updated_at?: string;
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  nickname: "คุณคนเก่ง",
  gender: "male",
  age: 28,
  heightCm: 172,
  currentWeightKg: 73.0,
  targetWeightKg: 68.0,
  activityLevel: "moderate",
  dailyKcalTarget: 1650,
  dailyWaterMl: 2500,
  dailyStepGoal: 10000,
};
