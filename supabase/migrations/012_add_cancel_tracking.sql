-- Migration: Add subscription period end tracking
-- Required for proper cancellation handling (cancel at period end)

-- Drop the unused subscriptions table (we store subscription data in zestio_users)
DROP TABLE IF EXISTS subscriptions CASCADE;

-- Add columns for tracking subscription period and cancellation
ALTER TABLE zestio_users
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_cancel_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_canceled_at TIMESTAMPTZ;

-- Update subscription_status check to include new statuses
ALTER TABLE zestio_users DROP CONSTRAINT IF EXISTS zestio_users_subscription_status_check;
ALTER TABLE zestio_users ADD CONSTRAINT zestio_users_subscription_status_check 
CHECK (subscription_status IN ('active', 'cancel_at_period_end', 'canceled', 'past_due', 'incomplete', 'trialing', 'unpaid'));

-- Comments
COMMENT ON COLUMN zestio_users.subscription_current_period_end IS 'End of current billing period from Stripe';
COMMENT ON COLUMN zestio_users.subscription_cancel_at IS 'When subscription will be canceled (if scheduled)';
COMMENT ON COLUMN zestio_users.subscription_canceled_at IS 'When subscription was canceled';
