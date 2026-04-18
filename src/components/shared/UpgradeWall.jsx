import { useNavigate } from 'react-router-dom';
import { HiLockClosed, HiCheckBadge, HiArrowUpRight } from 'react-icons/hi2';

const GOLD  = '#D4AF37';
const DEEP  = '#1F4D3A';
const GRAY  = '#4B5563';
const LGRAY = '#6B7280';

/**
 * UpgradeWall — consistent plan-gate UI rendered inside an existing layout.
 *
 * @param {string}   title        - Feature name shown as heading
 * @param {string}   description  - One-sentence explanation of what the feature does
 * @param {string}   requiredPlan - Human label e.g. "Pro Agent"
 * @param {string[]} bullets      - Up to 4 feature bullets shown in the unlock card
 *
 * @example
 * <UpgradeWall
 *   title="Commission Tracking"
 *   description="View your earnings, track payouts, and dispute commissions."
 *   requiredPlan="Pro Agent"
 *   bullets={['Lifetime earnings dashboard', 'Payout history', 'Commission disputes']}
 * />
 */
export default function UpgradeWall({ title, description, requiredPlan = 'Pro Agent', bullets = [] }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">

      {/* Lock icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)' }}
      >
        <HiLockClosed size={26} style={{ color: GOLD }} />
      </div>

      {/* Heading */}
      <h2 className="text-xl font-black mb-2" style={{ color: '#111111' }}>{title}</h2>

      {/* Plan label */}
      <p className="text-sm mb-1" style={{ color: LGRAY }}>
        Available on{' '}
        <span className="font-bold" style={{ color: DEEP }}>{requiredPlan}</span>
        {' '}and above.
      </p>

      {/* Description */}
      <p className="text-sm max-w-sm mb-6" style={{ color: GRAY, lineHeight: 1.7 }}>
        {description}
      </p>

      {/* Feature bullets */}
      {bullets.length > 0 && (
        <div
          className="rounded-2xl p-5 mb-6 max-w-xs w-full text-left"
          style={{ background: 'rgba(31,77,58,0.05)', border: '1px solid rgba(31,77,58,0.12)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: DEEP }}>
            Unlock with {requiredPlan}+
          </p>
          <ul className="flex flex-col gap-2.5">
            {bullets.map(b => (
              <li key={b} className="flex items-start gap-2 text-sm" style={{ color: GRAY }}>
                <HiCheckBadge size={16} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => navigate('/realtor/billing')}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all"
        style={{ background: GOLD }}
        onMouseEnter={e => e.currentTarget.style.background = '#B8962E'}
        onMouseLeave={e => e.currentTarget.style.background = GOLD}
      >
        <HiArrowUpRight size={16} />
        Upgrade Plan
      </button>

      <p className="text-xs mt-3" style={{ color: '#9CA3AF' }}>
        No commitment — upgrade or downgrade anytime.
      </p>
    </div>
  );
}
