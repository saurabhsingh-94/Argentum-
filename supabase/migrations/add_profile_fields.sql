-- Add missing profile columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_to_work BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS looking_for TEXT,
  ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'builder' CHECK (user_type IN ('builder', 'company')),
  ADD COLUMN IF NOT EXISTS pinned_post_id UUID,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS public_key TEXT,
  ADD COLUMN IF NOT EXISTS encrypted_private_key TEXT,
  ADD COLUMN IF NOT EXISTS key_backup_method TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS key_backup_hint TEXT,
  ADD COLUMN IF NOT EXISTS key_backup_created_at TIMESTAMPTZ;

-- Add missing post columns
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_priority BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_collab BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS release_url TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Ensure posts RLS allows authenticated inserts
DROP POLICY IF EXISTS "Auth insert posts" ON public.posts;
CREATE POLICY "Auth insert posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth update own posts" ON public.posts;
CREATE POLICY "Auth update own posts" ON public.posts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth delete own posts" ON public.posts;
CREATE POLICY "Auth delete own posts" ON public.posts
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Ensure users RLS allows authenticated updates
DROP POLICY IF EXISTS "Users update own" ON public.users;
CREATE POLICY "Users update own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- streak_history table
CREATE TABLE IF NOT EXISTS public.streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_date DATE NOT NULL,
  post_count INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_date)
);
ALTER TABLE public.streak_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own streak" ON public.streak_history;
CREATE POLICY "Users manage own streak" ON public.streak_history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for message-attachments
DROP POLICY IF EXISTS "Auth users can upload attachments" ON storage.objects;
CREATE POLICY "Auth users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'message-attachments');

DROP POLICY IF EXISTS "Public can read attachments" ON storage.objects;
CREATE POLICY "Public can read attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'message-attachments');

-- Storage RLS for avatars
DROP POLICY IF EXISTS "Auth users can upload avatars" ON storage.objects;
CREATE POLICY "Auth users can upload avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Public can read avatars" ON storage.objects;
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth users can update own avatars" ON storage.objects;
CREATE POLICY "Auth users can update own avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

-- Reload PostgREST schema cache so new columns are visible immediately
NOTIFY pgrst, 'reload schema';
