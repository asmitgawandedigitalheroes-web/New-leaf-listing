-- ═══════════════════════════════════════════════════════════════════
-- Referral tracking: referred_by + referral_code on profiles
-- Run in: Supabase → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- Add referral_code (stable unique token per user = their UUID)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Back-fill existing users: use their UUID as referral_code
UPDATE profiles
  SET referral_code = id::text
  WHERE referral_code IS NULL;

-- Index for fast ?ref= lookups on signup
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by   ON profiles(referred_by);

-- ── RPC: resolve a referral code → referrer UUID ────────────────────
-- Called from the signup page to convert ?ref=CODE to a UUID.
CREATE OR REPLACE FUNCTION resolve_referral_code(p_code text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM profiles WHERE referral_code = p_code LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION resolve_referral_code(text) TO anon, authenticated;
