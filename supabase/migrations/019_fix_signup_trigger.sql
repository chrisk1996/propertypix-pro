-- Migration 019: Fix signup trigger — zestio_users may not have full_name/avatar_url columns
-- The trigger from migration 017 tries to insert full_name and avatar_url which may not exist,
-- causing "Database error saving new user" on signup.

-- Add columns if they don't exist (safe idempotent operation)
ALTER TABLE public.zestio_users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.zestio_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Update the trigger function to handle missing columns gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.zestio_users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN undefined_column THEN
    -- Fallback: insert without full_name/avatar_url if columns somehow missing
    INSERT INTO public.zestio_users (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
