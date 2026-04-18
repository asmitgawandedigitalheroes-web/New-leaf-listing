-- =============================================================================
-- Migration: Safe audit log writer via SECURITY DEFINER RPC
--
-- Context: migrations_security_fixes.sql (BUG-028) removed the client-side
-- INSERT policy on audit_logs to prevent forged entries. However the
-- audit.service.ts still needs to write logs for admin actions (e.g. pricing
-- plan edits). A SECURITY DEFINER function lets the client call it via RPC
-- while the DB validates the caller is authenticated before writing.
-- =============================================================================

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
  -- Only allow authenticated callers
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, timestamp, metadata)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, NOW(), p_metadata);
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION log_audit_event FROM PUBLIC;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
