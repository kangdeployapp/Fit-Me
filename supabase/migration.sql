-- ================================================================
-- FitLife Tracker - Supabase Master Migration Script (v2: Profiles & Breakfast)
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ตาราง user_profiles (ข้อมูลพื้นฐานของผู้ใช้, BMR, TDEE และเป้าหมาย)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT NOT NULL DEFAULT 'คุณคนเก่ง',
    gender TEXT NOT NULL DEFAULT 'male',
    age INTEGER DEFAULT 28,
    height_cm NUMERIC(5, 2) DEFAULT 172.0,
    current_weight_kg NUMERIC(5, 2) DEFAULT 73.0,
    target_weight_kg NUMERIC(5, 2) DEFAULT 68.0,
    activity_level TEXT DEFAULT 'moderate',
    daily_kcal_target INTEGER DEFAULT 1650,
    daily_water_ml INTEGER DEFAULT 2500,
    daily_step_goal INTEGER DEFAULT 10000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ตาราง push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ตาราง weight_logs
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weight NUMERIC(5, 2) NOT NULL,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ตาราง daily_habits
CREATE TABLE IF NOT EXISTS public.daily_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    steps INTEGER DEFAULT 0,
    water_ml INTEGER DEFAULT 0,
    breakfast_meal TEXT,
    breakfast_kcal INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ตรวจสอบคอลัมน์ขาดหาย (Self-Healing)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT 'คุณคนเก่ง';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 28;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5, 2) DEFAULT 172.0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS current_weight_kg NUMERIC(5, 2) DEFAULT 73.0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC(5, 2) DEFAULT 68.0;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderate';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS daily_kcal_target INTEGER DEFAULT 1650;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS daily_water_ml INTEGER DEFAULT 2500;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS daily_step_goal INTEGER DEFAULT 10000;

ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE public.daily_habits ADD COLUMN IF NOT EXISTS breakfast_meal TEXT;
ALTER TABLE public.daily_habits ADD COLUMN IF NOT EXISTS breakfast_kcal INTEGER DEFAULT 0;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions (endpoint);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON public.weight_logs (logged_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_habits_date ON public.daily_habits (date DESC);

-- 7. Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all access on user_profiles" ON public.user_profiles;
CREATE POLICY "Allow public all access on user_profiles"
    ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public all access on push_subscriptions"
    ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on weight_logs" ON public.weight_logs;
CREATE POLICY "Allow public all access on weight_logs"
    ON public.weight_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on daily_habits" ON public.daily_habits;
CREATE POLICY "Allow public all access on daily_habits"
    ON public.daily_habits FOR ALL USING (true) WITH CHECK (true);

-- 8. Seed Initial Profile Data
INSERT INTO public.user_profiles (nickname, gender, age, height_cm, current_weight_kg, target_weight_kg, activity_level, daily_kcal_target, daily_water_ml, daily_step_goal)
VALUES ('คุณคนเก่ง', 'male', 28, 172.0, 73.0, 68.0, 'moderate', 1650, 2500, 10000)
ON CONFLICT DO NOTHING;
