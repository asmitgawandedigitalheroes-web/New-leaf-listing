-- ═══════════════════════════════════════════════════════════════════
-- Listing Upgrade Fix — run this single file in Supabase SQL Editor
-- Safe to re-run (all statements are idempotent)
-- ═══════════════════════════════════════════════════════════════════

-- Step 1: Ensure the unique index on payments.stripe_payment_id exists.
-- The apply_listing_upgrade_atomic RPC uses ON CONFLICT on this index.
-- Without it the function errors and the webhook silently does nothing.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_payment_id
  ON payments (stripe_payment_id)
  WHERE stripe_payment_id IS NOT NULL;

-- Step 2: Ensure listings has upgrade_expires_at column
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS upgrade_expires_at timestamptz;

-- Step 3: Create / replace the atomic listing upgrade RPC.
-- Wraps the audit log insert in an EXCEPTION block so a missing column
-- or policy never blocks the actual upgrade from going through.
CREATE OR REPLACE FUNCTION apply_listing_upgrade_atomic(
  p_listing_id            uuid,
  p_upgrade_type          text,
  p_user_id               uuid,
  p_stripe_payment_intent text,
  p_amount_cents          int
)
RETURNS TABLE (payment_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount     numeric(12,2);
  v_expires_at timestamptz;
  v_payment_id uuid;
BEGIN
  IF p_upgrade_type NOT IN ('standard', 'featured', 'top') THEN
    RAISE EXCEPTION 'Invalid upgrade_type: %. Must be standard, featured, or top.', p_upgrade_type
      USING ERRCODE = 'P0001';
  END IF;

  v_amount     := ROUND(p_amount_cents / 100.0, 2);
  v_expires_at := NOW() + INTERVAL '30 days';

  -- Step A: Update the listing's upgrade tier
  UPDATE listings
     SET upgrade_type       = p_upgrade_type,
         upgrade_expires_at = v_expires_at,
         updated_at         = NOW()
   WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing % not found.', p_listing_id USING ERRCODE = 'P0002';
  END IF;

  -- Step B: Insert payment row (idempotent via ON CONFLICT)
  INSERT INTO payments
    (user_id, type, amount, status, stripe_payment_id, description)
  VALUES
    (
      p_user_id,
      'listing_upgrade',
      v_amount,
      'succeeded',
      p_stripe_payment_intent,
      'Listing upgrade to ' || p_upgrade_type || ' for listing ' || p_listing_id::text
    )
  ON CONFLICT (stripe_payment_id) WHERE stripe_payment_id IS NOT NULL
    DO NOTHING
  RETURNING id INTO v_payment_id;

  -- Retrieve existing ID if ON CONFLICT DO NOTHING fired
  IF v_payment_id IS NULL THEN
    SELECT id INTO v_payment_id
      FROM payments
     WHERE stripe_payment_id = p_stripe_payment_intent;
  END IF;

  -- Step C: Audit log — wrapped in EXCEPTION so it never blocks the upgrade
  BEGIN
    INSERT INTO listing_audit_log
      (listing_id, action, performed_by, metadata, timestamp)
    VALUES
      (
        p_listing_id,
        'listing.upgraded_to_' || p_upgrade_type,
        p_user_id,
        jsonb_build_object(
          'upgradeType', p_upgrade_type,
          'amountCents', p_amount_cents,
          'expiresAt',   v_expires_at,
          'source',      'stripe_webhook'
        ),
        NOW()
      );
  EXCEPTION WHEN OTHERS THEN
    -- Audit failure must not roll back the upgrade or payment
    RAISE WARNING 'listing_audit_log insert failed: %', SQLERRM;
  END;

  RETURN QUERY SELECT v_payment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION apply_listing_upgrade_atomic(uuid, text, uuid, text, int)
  TO authenticated, anon;

-- ═══════════════════════════════════════════════════════════════════
-- Verify:
--   SELECT proname FROM pg_proc WHERE proname = 'apply_listing_upgrade_atomic';
--   \di payments  -- confirm uq_payments_stripe_payment_id exists
-- ═══════════════════════════════════════════════════════════════════
