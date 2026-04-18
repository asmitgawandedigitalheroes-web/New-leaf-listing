-- =============================================================================
-- Migration: Upsert pricing plans to match current website pricing
-- Run this in the Supabase SQL Editor
-- These values are confirmed by the client.
-- =============================================================================

INSERT INTO pricing_plans (slug, name, monthly_price, annual_price, features, is_active, sort_order)
VALUES
  (
    'starter',
    'Intro',
    99.00,
    950.00,
    '["Unlimited Listings","Basic CRM","Lead Capture","Platform Access"]',
    true,
    1
  ),
  (
    'pro',
    'Pro Agent',
    199.00,
    1910.00,
    '["Unlimited Listings","Advanced CRM & Automation","Enhanced Analytics","Access to New Leaf Buyer Network","Earn Commissions on New Leaf Products"]',
    true,
    2
  ),
  (
    'dominator',
    'Dominator',
    299.00,
    2870.00,
    '["Unlimited Listings","Full CRM & Automation Suite","Priority Lead Routing","Access to Developer Pre-Sales (Mexico & International)","First-Look Access to New Inventory","Higher Commission Opportunities"]',
    true,
    3
  ),
  (
    'sponsor',
    'Market Owner',
    0.00,
    0.00,
    '["Everything in Dominator","Exclusive Territory Rights","Protected Lead Flow","Priority Market Positioning","Direct Developer Access","White-Glove Support"]',
    true,
    4
  )
ON CONFLICT (slug) DO UPDATE SET
  name          = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  annual_price  = EXCLUDED.annual_price,
  features      = EXCLUDED.features,
  is_active     = EXCLUDED.is_active,
  sort_order    = EXCLUDED.sort_order,
  updated_at    = NOW();
