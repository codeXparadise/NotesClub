-- ========================================================
-- Migration: User Activities Log (Profile updates, password changes, actions)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'profile_update', 'password_change', 'login', 'reading_milestone'
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);

ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and insert their own activities" ON public.user_activities;
CREATE POLICY "Users can view and insert their own activities"
  ON public.user_activities FOR ALL
  USING (user_id = auth.uid() OR auth.uid() IS NULL)
  WITH CHECK (user_id = auth.uid() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Teachers can view all activities" ON public.user_activities;
CREATE POLICY "Teachers can view all activities"
  ON public.user_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'teacher'
    )
  );
