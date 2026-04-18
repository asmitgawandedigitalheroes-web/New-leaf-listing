-- ═══════════════════════════════════════════════════════════════════
-- Plan-based RLS enforcement
-- Run in: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ── Helper: get the authenticated user's subscription plan ──────────
CREATE OR REPLACE FUNCTION get_user_plan()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT plan FROM subscriptions
  WHERE user_id = auth.uid()
    AND status IN ('active', 'trialing')
  ORDER BY updated_at DESC
  LIMIT 1;
$$;

-- ── Helper: check plan is at or above a minimum tier ───────────────
CREATE OR REPLACE FUNCTION plan_at_least(min_plan text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(get_user_plan(), 'starter') = ANY(
    CASE min_plan
      WHEN 'starter'   THEN ARRAY['starter','pro','dominator','sponsor']
      WHEN 'pro'       THEN ARRAY['pro','dominator','sponsor']
      WHEN 'dominator' THEN ARRAY['dominator','sponsor']
      WHEN 'sponsor'   THEN ARRAY['sponsor']
      ELSE ARRAY[]::text[]
    END
  );
$$;

-- ── Helper: monthly leads assigned to auth user ─────────────────────
CREATE OR REPLACE FUNCTION realtor_monthly_lead_count()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM leads
  WHERE assigned_realtor_id = auth.uid()
    AND created_at >= date_trunc('month', now());
$$;

-- ═══════════════════════════════════════════════════════════════════
-- COMMISSIONS: require pro+ to read own commissions
-- ═══════════════════════════════════════════════════════════════════
-- Drop the old unrestricted realtor SELECT policy if it exists
DROP POLICY IF EXISTS "realtors_read_own_commissions"  ON commissions;
DROP POLICY IF EXISTS "realtor_view_own_commissions"   ON commissions;

-- New plan-gated policy: only pro/dominator/sponsor realtors can SELECT
CREATE POLICY "plan_gated_realtor_commissions_select"
  ON commissions FOR SELECT
  USING (
    -- Admins and directors are never restricted by plan
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin','director')
    )
    OR (
      recipient_user_id = auth.uid()
      AND plan_at_least('pro')
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- LISTINGS: enforce 5-listing cap for Starter plan on INSERT
-- ═══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "plan_gated_listings_insert" ON listings;

CREATE POLICY "plan_gated_listings_insert"
  ON listings FOR INSERT
  WITH CHECK (
    -- Admins/directors always allowed
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin','director')
    )
    OR
    -- Pro+ plans: unlimited
    plan_at_least('pro')
    OR
    -- Starter plan: max 5 active listings
    (
      NOT plan_at_least('pro')
      AND (
        SELECT COUNT(*) FROM listings
        WHERE realtor_id = auth.uid()
          AND status = 'active'
      ) < 5
    )
  );

-- ═══════════════════════════════════════════════════════════════════
-- LEADS: enforce 50/month cap for Starter plan on INSERT
-- ═══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "plan_gated_leads_insert" ON leads;

CREATE POLICY "plan_gated_leads_insert"
  ON leads FOR INSERT
  WITH CHECK (
    -- Admins/directors always allowed
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin','director')
    )
    OR
    -- Pro+ plans: unlimited
    plan_at_least('pro')
    OR
    -- Starter plan: max 50 leads per month
    (
      NOT plan_at_least('pro')
      AND realtor_monthly_lead_count() < 50
    )
  );

-- ── Grant execute on helpers to authenticated users ─────────────────
GRANT EXECUTE ON FUNCTION get_user_plan()              TO authenticated;
GRANT EXECUTE ON FUNCTION plan_at_least(text)          TO authenticated;
GRANT EXECUTE ON FUNCTION realtor_monthly_lead_count() TO authenticated;
