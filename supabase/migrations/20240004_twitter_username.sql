-- Add twitter_username column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS twitter_username text;
