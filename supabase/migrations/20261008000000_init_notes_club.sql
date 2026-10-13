-- ========================================================
-- Notes Club: Production Database Migration
-- Supabase Postgres + Row-Level Security (RLS)
-- Extensions, Tables, Triggers, Views, and Policies
-- ========================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ENUMS & DOMAINS (or CHECK constraints)
-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  roll_number TEXT UNIQUE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Categories (corresponds to Drive top-level folders)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  drive_folder_id TEXT UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Documents (Books & Notes stored in Google Drive)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_file_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  page_count INT NOT NULL DEFAULT 0,
  cover_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  allow_download BOOLEAN NOT NULL DEFAULT false,
  show_watermark BOOLEAN NOT NULL DEFAULT true,
  search_tsv TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Access Grants (Who can read what: per course or per student)
CREATE TABLE IF NOT EXISTS public.access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  -- Constraint: must target either document or course, or specific student
  CONSTRAINT chk_grant_target CHECK (
    (document_id IS NOT NULL) OR (course_id IS NOT NULL)
  )
);

-- Reading Progress (Cross-device resume keyed by student + document)
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  last_page INT NOT NULL DEFAULT 1,
  total_pages INT NOT NULL DEFAULT 1,
  percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_student_document UNIQUE(student_id, document_id)
);

-- Notifications (Teacher announcements & automated events)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('manual', 'auto')),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  audience TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'course', 'student')),
  audience_course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  audience_student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Notification Reads (Tracks read state per student)
CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (notification_id, student_id)
);

-- View Logs (Audit trail & reading telemetry)
CREATE TABLE IF NOT EXISTS public.view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  page INT NOT NULL DEFAULT 1,
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Search Logs (Analytics: finds zero-result searches to identify content gaps)
CREATE TABLE IF NOT EXISTS public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  results_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 3. SEARCH TSVECTOR TRIGGER & INDEXES
CREATE OR REPLACE FUNCTION public.fn_documents_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B');
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_search ON public.documents;
CREATE TRIGGER trg_documents_search
BEFORE INSERT OR UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.fn_documents_search_trigger();

-- GIN Index on Full-text search
CREATE INDEX IF NOT EXISTS idx_documents_search_tsv ON public.documents USING GIN(search_tsv);
-- GIN Trigram Index on title for live partial/fuzzy search
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON public.documents USING GIN(title gin_trgm_ops);

-- Supporting Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_roll ON public.profiles(roll_number);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_course ON public.documents(course_id);
CREATE INDEX IF NOT EXISTS idx_access_grants_student ON public.access_grants(student_id);
CREATE INDEX IF NOT EXISTS idx_access_grants_doc ON public.access_grants(document_id);
CREATE INDEX IF NOT EXISTS idx_access_grants_course ON public.access_grants(course_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_student ON public.reading_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_doc ON public.reading_progress(document_id);
CREATE INDEX IF NOT EXISTS idx_view_logs_doc_time ON public.view_logs(document_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_audience ON public.notifications(audience, audience_course_id, audience_student_id);

-- 4. ROW-LEVEL SECURITY (RLS) - DEFAULT DENY ON ALL TABLES
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: check if caller is teacher
CREATE OR REPLACE FUNCTION public.is_teacher(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'teacher' AND is_blocked = false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if caller is blocked
CREATE OR REPLACE FUNCTION public.is_caller_blocked(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE((
    SELECT is_blocked FROM public.profiles WHERE id = user_id
  ), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- --------------------------------------------------------
-- POLICIES: profiles
-- --------------------------------------------------------
-- Read: own profile OR teacher reads all
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_teacher(auth.uid())
  );

-- Insert: allowed during registration for own auth.uid()
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
  );

-- Update: users can update own profile (except role/blocked) OR teachers can update any
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (
    (auth.uid() = id AND NOT public.is_caller_blocked(auth.uid()))
    OR public.is_teacher(auth.uid())
  );

-- --------------------------------------------------------
-- POLICIES: courses & categories
-- --------------------------------------------------------
-- Read: all authenticated, non-blocked users
CREATE POLICY "courses_select_policy" ON public.courses
  FOR SELECT TO authenticated
  USING (NOT public.is_caller_blocked(auth.uid()));

CREATE POLICY "courses_admin_all" ON public.courses
  FOR ALL USING (public.is_teacher(auth.uid()));

CREATE POLICY "categories_select_policy" ON public.categories
  FOR SELECT TO authenticated
  USING (NOT public.is_caller_blocked(auth.uid()));

CREATE POLICY "categories_admin_all" ON public.categories
  FOR ALL USING (public.is_teacher(auth.uid()));

-- --------------------------------------------------------
-- POLICIES: documents
-- --------------------------------------------------------
-- Teacher: full select & write
CREATE POLICY "documents_teacher_all" ON public.documents
  FOR ALL USING (public.is_teacher(auth.uid()));

-- Student: SELECT ONLY if is_published = true AND matching access grant exists
CREATE POLICY "documents_student_select" ON public.documents
  FOR SELECT TO authenticated
  USING (
    is_published = true
    AND NOT public.is_caller_blocked(auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.access_grants ag
      LEFT JOIN public.profiles p ON p.id = auth.uid()
      WHERE
        (ag.expires_at IS NULL OR ag.expires_at > now())
        AND (
          -- Direct student grant for this document
          (ag.student_id = auth.uid() AND ag.document_id = documents.id)
          -- Course grant for this specific document
          OR (ag.course_id = p.course_id AND ag.document_id = documents.id)
          -- Course-wide grant covering all documents of this course/category
          OR (ag.course_id = p.course_id AND (ag.document_id IS NULL AND (documents.course_id = p.course_id OR documents.course_id IS NULL)))
          -- Document has no restrictions and course matches
          OR (documents.course_id IS NOT NULL AND documents.course_id = p.course_id)
        )
    )
  );

-- --------------------------------------------------------
-- POLICIES: access_grants
-- --------------------------------------------------------
-- Teacher: manage all
CREATE POLICY "access_grants_teacher_all" ON public.access_grants
  FOR ALL USING (public.is_teacher(auth.uid()));

-- Student: can read their own grants (direct or via course)
CREATE POLICY "access_grants_student_select" ON public.access_grants
  FOR SELECT TO authenticated
  USING (
    NOT public.is_caller_blocked(auth.uid())
    AND (
      student_id = auth.uid()
      OR course_id = (SELECT course_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- --------------------------------------------------------
-- POLICIES: reading_progress
-- --------------------------------------------------------
-- Student: manage own progress
CREATE POLICY "reading_progress_student_own" ON public.reading_progress
  FOR ALL TO authenticated
  USING (
    auth.uid() = student_id AND NOT public.is_caller_blocked(auth.uid())
  )
  WITH CHECK (
    auth.uid() = student_id AND NOT public.is_caller_blocked(auth.uid())
  );

-- Teacher: can read all reading progress for analytics/monitoring
CREATE POLICY "reading_progress_teacher_select" ON public.reading_progress
  FOR SELECT USING (public.is_teacher(auth.uid()));

-- --------------------------------------------------------
-- POLICIES: notifications
-- --------------------------------------------------------
-- Teacher: full access
CREATE POLICY "notifications_teacher_all" ON public.notifications
  FOR ALL USING (public.is_teacher(auth.uid()));

-- Student: SELECT when audience matches
CREATE POLICY "notifications_student_select" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    NOT public.is_caller_blocked(auth.uid())
    AND (
      audience = 'all'
      OR (audience = 'course' AND audience_course_id = (SELECT course_id FROM public.profiles WHERE id = auth.uid()))
      OR (audience = 'student' AND audience_student_id = auth.uid())
    )
  );

-- --------------------------------------------------------
-- POLICIES: notification_reads
-- --------------------------------------------------------
CREATE POLICY "notification_reads_own" ON public.notification_reads
  FOR ALL TO authenticated
  USING (auth.uid() = student_id AND NOT public.is_caller_blocked(auth.uid()))
  WITH CHECK (auth.uid() = student_id AND NOT public.is_caller_blocked(auth.uid()));

-- --------------------------------------------------------
-- POLICIES: view_logs
-- --------------------------------------------------------
-- Student/System: can insert own log
CREATE POLICY "view_logs_insert_own" ON public.view_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id OR student_id IS NULL);

-- Teacher: can view all logs
CREATE POLICY "view_logs_teacher_select" ON public.view_logs
  FOR SELECT USING (public.is_teacher(auth.uid()));

-- --------------------------------------------------------
-- POLICIES: search_logs
-- --------------------------------------------------------
CREATE POLICY "search_logs_insert" ON public.search_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id OR student_id IS NULL);

CREATE POLICY "search_logs_teacher_select" ON public.search_logs
  FOR SELECT USING (public.is_teacher(auth.uid()));
