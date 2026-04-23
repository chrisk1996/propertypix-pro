-- Migration 017: Fix user creation trigger to use zestio_users
-- The trigger was still referencing the old table name after the rename

-- Update the trigger function to insert into zestio_users
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the credits trigger if it references old table
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- Credits are now stored directly in zestio_users table
  -- No separate enhancement_credits table needed
  -- Default credits are set by the column default (5 for free tier)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
