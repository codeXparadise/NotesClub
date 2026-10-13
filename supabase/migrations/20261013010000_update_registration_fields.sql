-- ========================================================
-- Migration: Add division and ensure college/academic fields in profiles
-- ========================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS division TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_name TEXT DEFAULT 'KES Shroff College';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year_or_class TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT timezone('utc', now());
