-- Add 'Speak' to the posts_category_check constraint
ALTER TABLE public.posts 
DROP CONSTRAINT IF EXISTS posts_category_check;

ALTER TABLE public.posts 
ADD CONSTRAINT posts_category_check 
CHECK (category IN ('Web3', 'AI', 'Mobile', 'DevTools', 'Game', 'Other', 'Speak'));

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
