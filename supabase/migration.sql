-- ================================================================
-- FitLife Tracker - Supabase Master Migration Script (v3: AI & Garmin & Automated Push)
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ตาราง user_profiles (เพิ่มฟิลด์ Garmin & Goals)
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
    garmin_device TEXT DEFAULT 'Garmin Forerunner 265',
    garmin_last_sync TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS garmin_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS garmin_device TEXT DEFAULT 'Garmin Forerunner 265';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS garmin_last_sync TIMESTAMP WITH TIME ZONE;

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

-- 5. ตาราง breakfast_recipes (ฐานข้อมูลอาหารเช้าใน Supabase)
CREATE TABLE IF NOT EXISTS public.breakfast_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- high_protein, low_carb, low_calorie, quick_easy, plant_based
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

-- 6. ตาราง notification_logs (ประวัติแจ้งเตือนอัตโนมัติ เพื่อป้องกันส่งซ้ำซ้อน)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type TEXT NOT NULL, -- breakfast_missing, water_behind, steps_deficit, evening_summary
    sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sent_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_date ON public.notification_logs (sent_date, alert_type);
CREATE INDEX IF NOT EXISTS idx_breakfast_recipes_cat ON public.breakfast_recipes (category);

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

-- 8. Seed ฐานข้อมูลอาหารเช้าเริ่มต้นลงใน Supabase
INSERT INTO public.breakfast_recipes (name, category, category_label, icon, kcal, protein_g, carbs_g, fat_g, fiber_g, cooking_time_minutes, difficulty, description)
VALUES 
    ('ไข่ต้ม 2 ฟอง + อะโวคาโดครึ่งลูก + ขนมปังโฮลวีต', 'high_protein', 'โปรตีนสูง', '🥑', 340, 19.0, 18.0, 16.0, 6.0, 7, 'ง่ายมาก', 'คู่หูอาหารเช้าคลาสสิก ได้โปรตีนสมบูรณ์จากไข่ และไขมันไม่อิ่มตัวเชิงเดี่ยวจากอะโวคาโด'),
    ('สเต็กอกไก่ย่างพริกไทยดำ + บรอกโคลีนึ่ง', 'high_protein', 'โปรตีนสูง', '🍗', 290, 38.0, 7.0, 5.0, 4.0, 12, 'ง่าย', 'เนื้ออกไก่ไร้หนัง 150g ย่างด้วยกระทะเทฟลอน เสิร์ฟพร้อมบรอกโคลีวิตามินซีสูง'),
    ('กรีกโยเกิร์ตแท้ 0% + เวย์โปรตีน + บลูเบอร์รี่สด', 'high_protein', 'โปรตีนสูง', '🫐', 230, 28.0, 16.0, 2.0, 3.0, 3, 'ง่ายมาก', 'กรีกโยเกิร์ตโปรตีนสูงผสมผงโปรตีนรสวานิลลา ท็อปปิ้งด้วยบลูเบอร์รี่อุดมสารต้านอนุมูลอิสระ'),
    ('ไข่คนแซลมอนรมควัน โรยต้นหอมซอย', 'high_protein', 'โปรตีนสูง', '🍳', 310, 26.0, 3.0, 18.0, 1.0, 8, 'ง่าย', 'ไข่ไก่ 2 ฟองตีกับนมไขมันต่ำ คั่วจนนุ่ม ใส่แซลมอนรมควันหอมกรุ่น โอเมก้า 3 สูง'),
    ('ไข่กระทะทรงเครื่องไร้น้ำมัน (อกไก่สับ + เห็ดหอม)', 'low_carb', 'คาร์บต่ำ', '🍳', 235, 23.0, 4.0, 11.0, 2.0, 10, 'ง่าย', 'ดัดแปลงไข่กระทะสูตรสุขภาพ ใช้สเปรย์น้ำมันมะกอก อกไก่สับและเห็ดหอมแทนกุนเชียง'),
    ('สลัดทูน่าในน้ำแร่ + ผักคอส + อะโวคาโดครึ่งลูก', 'low_carb', 'คาร์บต่ำ', '🥗', 270, 28.0, 5.0, 14.0, 5.0, 5, 'ง่ายมาก', 'ทูน่ากระป๋องในน้ำแร่บีบน้ำออก คลุกเคล้าผักสลัดสด ปรุงรสด้วยน้ำมะนาว เกลือชมพู พริกไทยดำ'),
    ('ข้าวต้มข้าวกล้องเนื้อปลากะพง ผักชีขิงซอย', 'low_calorie', 'แคลอรี่ต่ำ', '🐟', 220, 24.0, 22.0, 2.0, 3.0, 12, 'ง่าย', 'น้ำซุปใสกระดูกปลาเคี่ยวหอมกรุ่น เนื้อปลากะพงขาวสด ขิงซอยขับลม อบอุ่นสบายท้อง'),
    ('ซุปเต้าหู้ไข่หมูสับสาหร่ายวากาเมะ', 'low_calorie', 'แคลอรี่ต่ำ', '🥣', 185, 18.0, 6.0, 7.0, 2.0, 10, 'ง่าย', 'ต้มจืดน้ำใสซดคล่องคอ เต้าหู้ไข่นุ่มๆ หมูสับไร้มัน และสาหร่ายวากาเมะแร่ธาตุไอโอดีนสูง'),
    ('แซนด์วิชทูน่าโฮลวีต 7-Eleven + กาแฟดำอเมริกาโน่', 'quick_easy', 'มื้อเร่งด่วน', '🥪', 260, 17.0, 28.0, 6.0, 3.0, 1, 'ง่ายมาก', 'เมนูหาง่ายประจำร้านสะดวกซื้อ ได้โปรตีนจากทูน่า คาร์บเชิงซ้อนจากขนมปังโฮลวีต และกาแฟกระตุ้นเผาผลาญ'),
    ('นมโปรตีนสูง Meiji High Protein + กล้วยหอม 1 ลูก', 'quick_easy', 'มื้อเร่งด่วน', '🥛', 280, 29.0, 34.0, 2.0, 3.0, 1, 'ง่ายมาก', 'คอมโบยอดฮิตของสายฟิตเนส นมโปรตีน 28g ดื่มคู่กับกล้วยหอมที่ให้พลังงานเร็วและโพแทสเซียม'),
    ('โอเวอร์ไนท์โอ๊ตเมล็ดเจีย (นมข้าวโอ๊ต + อัลมอนด์)', 'plant_based', 'แพลนต์เบสด์', '🥣', 285, 11.0, 38.0, 9.0, 8.0, 2, 'ง่ายมาก', 'แช่ข้าวโอ๊ตและเมล็ดเจียในนมพืชข้ามคืน เช้ามาตักทานได้ทันที อุดมด้วยไฟเบอร์สูงมาก')
ON CONFLICT DO NOTHING;
