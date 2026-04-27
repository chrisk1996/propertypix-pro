-- Migration 023: Fix deduct_credits RPC for Model A credit system
-- credits = remaining balance (decremented on use)
-- used_credits = total ever consumed (incremented on use, reset on billing cycle)

CREATE OR REPLACE FUNCTION deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT credits INTO v_credits
  FROM zestio_users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Check sufficient credits
  IF v_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct from balance, track usage
  UPDATE zestio_users
  SET credits = credits - p_amount,
      used_credits = used_credits + p_amount
  WHERE id = p_user_id;

  RETURN v_credits - p_amount;
END;
$$;

-- Add refund_credits RPC for video job refunds
CREATE OR REPLACE FUNCTION refund_credits(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT credits INTO v_credits
  FROM zestio_users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  UPDATE zestio_users
  SET credits = credits + p_amount
  WHERE id = p_user_id;

  RETURN v_credits + p_amount;
END;
$$;
