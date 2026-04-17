-- Migration: Fix duplicate status columns - drop plan_status, keep subscription_status
-- The table had both plan_status and subscription_status which was confusing

-- Drop the duplicate plan_status column (we use subscription_status)
ALTER TABLE zestio_users DROP COLUMN IF EXISTS plan_status;

-- Ensure subscription_tier column exists (for the tier: free/pro/enterprise)
ALTER TABLE zestio_users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

-- Ensure subscription_status column exists (for the Stripe status: active/canceled/etc)
ALTER TABLE zestio_users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing'));

-- Ensure stripe_customer_id exists
ALTER TABLE zestio_users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Ensure stripe_subscription_id exists
ALTER TABLE zestio_users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Drop the legacy 'plan' column if it exists (we use subscription_tier now)
ALTER TABLE zestio_users DROP COLUMN IF EXISTS plan;

-- Comments
COMMENT ON COLUMN zestio_users.subscription_tier IS 'Subscription plan: free, pro, or enterprise';
COMMENT ON COLUMN zestio_users.subscription_status IS 'Current subscription status from Stripe: active, canceled, past_due, incomplete, trialing';
COMMENT ON COLUMN zestio_users.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN zestio_users.stripe_subscription_id IS 'Active Stripe subscription ID';
