-- Migration: Consolidate credits system to use only propertypix_users table
-- Remove enhancement_credits table and credits_used column

-- Step 1: Migrate any data from enhancement_credits to propertypix_users (if exists)
-- This ensures no data is lost before dropping the table

DO $$
BEGIN
  -- Check if enhancement_credits table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhancement_credits') THEN
    -- Update propertypix_users with data from enhancement_credits where propertypix_users has default values
    UPDATE propertypix_users pu
    SET 
      credits = COALESCE(ec.credits_total, 10),
      used_credits = COALESCE(ec.credits_used, 0)
    FROM enhancement_credits ec
    WHERE pu.id = ec.user_id
      AND pu.credits = 10  -- Only update if still at default
      AND pu.used_credits = 0;
    
    -- Drop the enhancement_credits table
    DROP TABLE IF EXISTS enhancement_credits CASCADE;
  END IF;
END $$;

-- Step 2: Remove the duplicate credits_used column from propertypix_users
-- We keep: credits (total available) and used_credits (already used)
-- We remove: credits_used (duplicate of used_credits)

ALTER TABLE propertypix_users 
DROP COLUMN IF EXISTS credits_used;

-- Step 3: Ensure proper constraints
ALTER TABLE propertypix_users 
ALTER COLUMN credits SET DEFAULT 10,
ALTER COLUMN used_credits SET DEFAULT 0;

-- Step 4: Add comment documenting the schema
COMMENT ON TABLE propertypix_users IS 'User credits and subscription info. credits = total available, used_credits = already consumed';
COMMENT ON COLUMN propertypix_users.credits IS 'Total credits available to the user';
COMMENT ON COLUMN propertypix_users.used_credits IS 'Credits already used by the user';
