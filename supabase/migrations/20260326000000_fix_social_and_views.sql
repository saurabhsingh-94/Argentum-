-- Fix handle_new_user trigger to ensure a valid username is always present
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, avatar_url, username, display_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', 'Builder')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic Upvote Function
-- This handles both the join table 'upvotes' and the counter in 'posts'
CREATE OR REPLACE FUNCTION increment_upvotes(post_id_input UUID)
RETURNS VOID AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Insert into upvotes table (tracks WHO upvoted)
  -- This will fail if the user already upvoted (due to Unique constraint)
  -- So we handle that with ON CONFLICT
  INSERT INTO public.upvotes (user_id, post_id)
  VALUES (current_user_id, post_id_input)
  ON CONFLICT (user_id, post_id) DO NOTHING;

  -- Only increment if we actually added a new upvote record
  IF FOUND THEN
    UPDATE public.posts 
    SET upvotes = upvotes + 1 
    WHERE id = post_id_input;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic Decrement Function
CREATE OR REPLACE FUNCTION decrement_upvotes(post_id_input UUID)
RETURNS VOID AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Delete from upvotes table
  DELETE FROM public.upvotes 
  WHERE user_id = current_user_id AND post_id = post_id_input;

  -- If a record was deleted, decrement the counter
  IF FOUND THEN
    UPDATE public.posts 
    SET upvotes = GREATEST(0, upvotes - 1) 
    WHERE id = post_id_input;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View Counting Function
CREATE OR REPLACE FUNCTION increment_post_views(post_id_input UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts 
  SET views = COALESCE(views, 0) + 1 
  WHERE id = post_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure 'views' column exists in posts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='views') THEN
    ALTER TABLE public.posts ADD COLUMN views INT DEFAULT 0;
  END IF;
END $$;
