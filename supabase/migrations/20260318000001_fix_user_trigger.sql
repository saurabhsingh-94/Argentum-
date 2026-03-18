-- Fix for broken users table and trigger

-- 1. Correct the users table structure
ALTER TABLE public.users 
ALTER COLUMN username DROP NOT NULL,
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update the handle_new_user function to be robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, avatar_url, username, created_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(users.avatar_url, EXCLUDED.avatar_url);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure all existing auth users have a profile
INSERT INTO public.users (id, email, avatar_url, username, created_at)
SELECT 
  id, 
  email, 
  raw_user_meta_data->>'avatar_url', 
  COALESCE(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 8)),
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
