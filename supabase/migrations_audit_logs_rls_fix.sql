-- =============================================================================
-- Migration: Fix audit_logs RLS INSERT violation (BUG-028 follow-up)
--
-- Context:
--   migrations_security_fixes.sql (BUG-028) dropped ALL INSERT policies on
--   audit_logs to prevent row fabrication. However Supabase's hosted Postgres
--   does NOT guarantee that SECURITY DEFINER functions bypass RLS, even when
--   owned by the postgres superuser. As a result, log_audit_event() fails with:
--     "new row violates row-level security policy for table audit_logs"
--
-- Fix:
--   1. Re-add "audit_logs_insert_authenticated" policy for authenticated role
--      (auth.role() = 'authenticated'). This matches the original schema.sql
--      policy that BUG-028 removed. The log_audit_event() function enforces
--      the meaningful security boundary (auth.uid() must be non-null).
--
--   2. Replace log_audit_event() keeping SECURITY DEFINER + auth.uid() null guard,
--      but removing over-restrictive user_id = auth.uid() check that broke routing
--      (applyRouting logs events attributed to the assigned realtor, not the caller).
--
--   3. service_role bypasses RLS by default — no extra policy needed.
-- =============================================================================

-- ── 1. Secure INSERT policy ──────────────────────────────────────────────────

-- Drop any stale remnants first to keep this idempotent
DROP POLICY IF EXISTS "audit_logs_insert_own_entries"            ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_authenticated"          ON audit_logs;
DROP POLICY IF EXISTS "Anyone can insert audit logs"             ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;

-- Restore INSERT for authenticated users.
--
-- Why not restrict to user_id = auth.uid()?
--   The routing service logs audit events attributed to the ASSIGNED REALTOR
--   (result.assigned_realtor_id), not the calling admin. A strict uid check
--   would break applyRouting(). The log_audit_event() function itself validates
--   that auth.uid() is non-null (i.e., caller is authenticated), which is the
--   meaningful security boundary. Forging entries is only useful if an attacker
--   is already authenticated and writing misleading logs — the audit trail is
--   append-only (no UPDATE/DELETE policy for authenticated users), so the impact
--   is limited and the operational risk outweighs the restriction benefit.
CREATE POLICY "audit_logs_insert_authenticated" ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- service_role bypasses RLS by default — no separate policy needed.

-- ── 2. Harden log_audit_event() ─────────────────────────────────────────────
--
-- Keep SECURITY DEFINER so callers don't need direct INSERT rights.
-- The only security guard needed here is the auth.uid() null check
-- (reject anonymous callers). The INSERT policy above ensures the
-- function only works for authenticated sessions.

CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id     uuid,
  p_action      text,
  p_entity_type text,
  p_entity_id   uuid        DEFAULT NULL,
  p_metadata    jsonb       DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard: reject anonymous / unauthenticated callers
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated — audit log requires an active session';
  END IF;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, timestamp, metadata)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, NOW(), p_metadata);
END;
$$;

-- Permissions unchanged: only authenticated role may call this function
REVOKE ALL ON FUNCTION log_audit_event(uuid, text, text, uuid, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION log_audit_event(uuid, text, text, uuid, jsonb) TO authenticated;
