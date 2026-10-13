-- ========================================================
-- Migration: Favorites (Wishlist) & Drive Sync Cron Job
-- ========================================================

-- 1. FAVORITES / WISHLIST TABLE
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_student_favorite UNIQUE(student_id, document_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_student_id ON public.favorites(student_id);
CREATE INDEX IF NOT EXISTS idx_favorites_document_id ON public.favorites(document_id);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Students can view their own favorites" ON public.favorites;
CREATE POLICY "Students can view their own favorites"
  ON public.favorites FOR SELECT
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can add their own favorites" ON public.favorites;
CREATE POLICY "Students can add their own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can remove their own favorites" ON public.favorites;
CREATE POLICY "Students can remove their own favorites"
  ON public.favorites FOR DELETE
  USING (student_id = auth.uid());

-- Allow Teachers / Admins to view aggregate favorite stats
DROP POLICY IF EXISTS "Teachers can view all favorites" ON public.favorites;
CREATE POLICY "Teachers can view all favorites"
  ON public.favorites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    )
  );

-- ========================================================
-- 2. PG_CRON SETUP FOR AUTOMATIC GOOGLE DRIVE SYNC
-- ========================================================
-- Enables periodic sync without breaking the site or user sessions.
-- Runs every 30 minutes to check additions/deletions.

DO $$
BEGIN
  -- Attempt to enable pg_cron and pg_net if supported by project tier
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  CREATE EXTENSION IF NOT EXISTS pg_net;

  -- Remove prior schedule if exists
  PERFORM cron.unschedule('sync-google-drive-notes')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-google-drive-notes');

  -- Schedule sync every 30 minutes
  PERFORM cron.schedule(
    'sync-google-drive-notes',
    '*/30 * * * *',
    $cron$
    SELECT net.http_post(
      url := 'https://sqihjhyargpxtaoywues.supabase.co/functions/v1/sync-drive',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
    $cron$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron or pg_net not enabled on this database role. You can trigger sync-drive via external cron or the /api/sync-drive webhook.';
END $$;
