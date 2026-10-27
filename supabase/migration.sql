-- ================================================================
-- FitLife Tracker - Supabase Master Migration Script (v4: Real Garmin & Fitness Age & AI)
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ตาราง user_profiles (ข้อมูลผู้ใช้, Garmin Device, อายุสุขภาพ Fitness Age)
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
    garmin_connected BOOLEAN DEFAULT FALSE,
    garmin_device TEXT DEFAULT 'Garmin Instinct 2',
    garmin_last_sync TIMESTAMP WITH TIME ZONE,
    fitness_age INTEGER DEFAULT 24,
    resting_hr INTEGER DEFAULT 58,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS garmin_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS garmin_device TEXT DEFAULT 'Garmin Instinct 2';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS garmin_last_sync TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS fitness_age INTEGER DEFAULT 24;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS resting_hr INTEGER DEFAULT 58;

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

-- 3. ตาราง weight_logs (บันทึกน้ำหนักจริง)
CREATE TABLE IF NOT EXISTS public.weight_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weight NUMERIC(5, 2) NOT NULL,
    logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON public.weight_logs (logged_date DESC);

-- 4. ตาราง daily_habits
CREATE TABLE IF NOT EXISTS public.daily_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    steps INTEGER DEFAULT 0,
    water_ml INTEGER DEFAULT 0,
    breakfast_meal TEXT,
    breakfast_kcal INTEGER DEFAULT 0,
    fitness_age INTEGER DEFAULT 24,
    resting_hr INTEGER DEFAULT 58,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.daily_habits ADD COLUMN IF NOT EXISTS fitness_age INTEGER DEFAULT 24;
ALTER TABLE public.daily_habits ADD COLUMN IF NOT EXISTS resting_hr INTEGER DEFAULT 58;

CREATE INDEX IF NOT EXISTS idx_daily_habits_date ON public.daily_habits (date DESC);

-- 5. ตาราง breakfast_recipes (ฐานข้อมูลอาหารเช้าจริง)
CREATE TABLE IF NOT EXISTS public.breakfast_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    category_label TEXT NOT NULL,
    icon TEXT DEFAULT '🍽️',
    kcal INTEGER NOT NULL,
    protein_g NUMERIC(5, 1) DEFAULT 0,
    carbs_g NUMERIC(5, 1) DEFAULT 0,
    fat_g NUMERIC(5, 1) DEFAULT 0,
    fiber_g NUMERIC(5, 1) DEFAULT 0,
    cooking_time_minutes INTEGER DEFAULT 5,
    difficulty TEXT DEFAULT 'ง่าย',
    description TEXT,
    ingredients JSONB DEFAULT '[]'::jsonb,
    recipe_steps JSONB DEFAULT '[]'::jsonb,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_breakfast_recipes_cat ON public.breakfast_recipes (category);

-- 6. ตาราง notification_logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL,
    sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sent_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_date ON public.notification_logs (sent_date, alert_type);

-- 7. Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breakfast_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all access on user_profiles" ON public.user_profiles;
CREATE POLICY "Allow public all access on user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Allow public all access on push_subscriptions" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on weight_logs" ON public.weight_logs;
CREATE POLICY "Allow public all access on weight_logs" ON public.weight_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on daily_habits" ON public.daily_habits;
CREATE POLICY "Allow public all access on daily_habits" ON public.daily_habits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on breakfast_recipes" ON public.breakfast_recipes;
CREATE POLICY "Allow public all access on breakfast_recipes" ON public.breakfast_recipes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all access on notification_logs" ON public.notification_logs;
CREATE POLICY "Allow public all access on notification_logs" ON public.notification_logs FOR ALL USING (true) WITH CHECK (true);
