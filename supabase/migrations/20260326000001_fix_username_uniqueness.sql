-- Migration: Fix Username Uniqueness and RLS
-- Description: Adds a UNIQUE constraint to public.users.username and ensures a SELECT policy exists for availability checks.

-- 1. Ensure citext extension is available for case-insensitive uniqueness
-- This ensures 'User1' and 'user1' are treated as the same.
CREATE EXTENSION IF NOT EXISTS citext;

-- 2. Update username column to be case-insensitive and UNIQUE
-- We also add a constraint name for easier error handling in the frontend.
ALTER TABLE public.users 
ALTER COLUMN username TYPE citext;

-- Add the unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);
    END IF;
END $$;

-- 3. Ensure public SELECT policy exists for public.users
-- This is required for the onboarding "check availability" and for profile pages.
DROP POLICY IF EXISTS "Public can read profiles" ON public.users;
CREATE POLICY "Public can read profiles" ON public.users 
  FOR SELECT TO public
  USING (true);

-- 4. Ensure users can continue to update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
