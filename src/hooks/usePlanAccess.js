import { useAuth } from '../context/AuthContext';

/**
 * Which plans grant access to each feature.
 * Mirrors FEATURE_MAP in services/subscription.service.ts — keep in sync.
 */
const FEATURE_MAP = {
  'leads.unlimited':      ['dominator', 'sponsor'],
  'listings.unlimited':   ['dominator', 'sponsor'],
  'crm.integrations':     ['dominator', 'sponsor'],
  'commission.full_suite':['dominator', 'sponsor'],
  'support.dedicated':    ['dominator', 'sponsor'],
  'territory.sponsor':    ['sponsor'],
  'listings.featured':    ['pro', 'dominator', 'sponsor'],
  'listings.top':         ['dominator', 'sponsor'],
  'commission.tracking':  ['pro', 'dominator', 'sponsor'],
  'referrals.access':     ['pro', 'dominator', 'sponsor'],
  'analytics.enhanced':   ['pro', 'dominator', 'sponsor'],
  'support.phone':        ['pro', 'dominator', 'sponsor'],
};

/** Per-plan hard limits. -1 = unlimited. */
const PLAN_LIMITS = {
  starter:   { listings: 5,  leads: 50  },
  pro:       { listings: -1, leads: -1  },
  dominator: { listings: -1, leads: -1  },
  sponsor:   { listings: -1, leads: -1  },
};

/**
 * Hook for subscription-plan-based feature access.
 *
 * @example
 * const { canAccess, planLimits, plan, isActive } = usePlanAccess();
 * canAccess('commission.tracking')  // false for starter
 * planLimits.listings               // 5 for starter, -1 (unlimited) for others
 */
export function usePlanAccess() {
  const { subscription } = useAuth();

  const plan     = subscription?.plan   ?? 'starter';
  const status   = subscription?.status ?? null;
  const isActive = status === 'active' || status === 'trialing';

  /**
   * Returns true if the current plan grants access to a feature.
   * Admins/directors bypass plan checks — pass role if needed.
   */
  const canAccess = (feature) => {
    if (!isActive) return false;
    const allowed = FEATURE_MAP[feature];
    if (!allowed) return true; // unknown feature = unrestricted
    return allowed.includes(plan);
  };

  const planLimits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

  return {
    plan,
    status,
    isActive,
    canAccess,
    planLimits,
  };
}

export default usePlanAccess;
