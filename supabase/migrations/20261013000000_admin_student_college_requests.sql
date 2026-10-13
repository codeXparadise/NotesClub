-- ========================================================
-- Migration: Enhanced Student Profiles, Access Requests, and Search Logs
-- ========================================================

-- 1. EXTEND PROFILES TABLE WITH ACADEMIC & ACTIVITY DETAILS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stream TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year_or_class TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT timezone('utc', now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- 2. ACCESS REQUESTS TABLE (FOR BLOCKED STUDENTS OR SPECIAL ACCESS)
CREATE TABLE IF NOT EXISTS public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  roll_number TEXT,
  college_name TEXT,
  type TEXT NOT NULL DEFAULT 'unblock' CHECK (type IN ('unblock', 'book_request', 'course_access')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_access_requests_student_id ON public.access_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON public.access_requests(status);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view and create their own access requests" ON public.access_requests;
CREATE POLICY "Students can view and create their own access requests"
  ON public.access_requests FOR ALL
  USING (student_id = auth.uid() OR auth.uid() IS NULL)
  WITH CHECK (student_id = auth.uid() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Teachers can manage all access requests" ON public.access_requests;
CREATE POLICY "Teachers can manage all access requests"
  ON public.access_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    )
  );

-- 3. USER SEARCH LOGS (FOR TEACHER ANALYTICS & USER AUDIT)
CREATE TABLE IF NOT EXISTS public.user_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_user_searches_student_id ON public.user_searches(student_id);
CREATE INDEX IF NOT EXISTS idx_user_searches_created_at ON public.user_searches(created_at DESC);

ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can insert their searches" ON public.user_searches;
CREATE POLICY "Students can insert their searches"
  ON public.user_searches FOR INSERT
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can view all searches" ON public.user_searches;
CREATE POLICY "Teachers can view all searches"
  ON public.user_searches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    )
  );
