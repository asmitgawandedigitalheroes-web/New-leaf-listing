import { useState, useEffect } from 'react';
import AppLayout from '../../../components/layout/AppLayout';
import { SectionCard } from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import { useAuth } from '../../../context/AuthContext';
import { usePlanAccess } from '../../../hooks/usePlanAccess';
import UpgradeWall from '../../../components/shared/UpgradeWall';
import { supabase } from '../../../lib/supabase';
import { HiArrowTrendingUp, HiHome, HiUsers, HiBanknotes, HiEye } from 'react-icons/hi2';

const GOLD = '#D4AF37';
const DEEP = '#1F4D3A';

function StatCard({ label, value, icon: Icon, loading }) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: '#fff', border: '1px solid #E5E7EB' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(31,77,58,0.08)' }}>
        <Icon size={20} style={{ color: DEEP }} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#6B7280' }}>{label}</p>
        {loading
          ? <Skeleton width="60px" height="24px" />
          : <p className="text-2xl font-black" style={{ color: '#111111' }}>{value}</p>
        }
      </div>
    </div>
  );
}


export default function RealtorAnalyticsPage() {
  const { user, profile } = useAuth();
  const { canAccess, plan, isActive } = usePlanAccess();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalLeads: 0,
    thisMonthLeads: 0,
    totalCommissions: 0,
    pendingCommissions: 0,
  });
  const [monthlyLeads, setMonthlyLeads] = useState([]);

  const hasAnalyticsAccess = isActive && ['pro', 'dominator', 'sponsor'].includes(plan);

  useEffect(() => {
    if (!user?.id || !hasAnalyticsAccess) return;

    async function load() {
      setLoading(true);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [listingsRes, leadsRes, thisMonthLeadsRes, commissionsRes, pendingRes] = await Promise.all([
        supabase.from('listings').select('id, status').eq('realtor_id', user.id),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('assigned_realtor_id', user.id),
        supabase.from('leads').select('id', { count: 'exact', head: true })
          .eq('assigned_realtor_id', user.id).gte('created_at', monthStart),
        supabase.from('commissions').select('amount').eq('recipient_user_id', user.id).eq('status', 'paid'),
        supabase.from('commissions').select('amount').eq('recipient_user_id', user.id).eq('status', 'pending'),
      ]);

      const listings = listingsRes.data || [];
      const totalComm = (commissionsRes.data || []).reduce((s, c) => s + Number(c.amount || 0), 0);
      const pendingComm = (pendingRes.data || []).reduce((s, c) => s + Number(c.amount || 0), 0);

      setStats({
        totalListings:      listings.length,
        activeListings:     listings.filter(l => l.status === 'active').length,
        totalLeads:         leadsRes.count ?? 0,
        thisMonthLeads:     thisMonthLeadsRes.count ?? 0,
        totalCommissions:   totalComm,
        pendingCommissions: pendingComm,
      });

      // Monthly lead trend: last 6 months
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          start: d.toISOString(),
          end:   new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
        });
      }

      const trendData = await Promise.all(
        months.map(m =>
          supabase.from('leads').select('id', { count: 'exact', head: true })
            .eq('assigned_realtor_id', user.id)
            .gte('created_at', m.start)
            .lt('created_at', m.end)
            .then(r => ({ label: m.label, count: r.count ?? 0 }))
        )
      );
      setMonthlyLeads(trendData);
      setLoading(false);
    }

    load();
  }, [user?.id, hasAnalyticsAccess]);

  if (!canAccess('analytics.enhanced')) {
    return (
      <AppLayout role={profile?.role || 'realtor'} title="Analytics"
        user={{ name: profile?.full_name || 'User', role: profile?.role || 'realtor', initials: (profile?.full_name || 'U').slice(0, 2).toUpperCase() }}>
        <UpgradeWall
          title="Enhanced Analytics"
          description="Track listing views, lead trends, commission history, and monthly performance in one place."
          requiredPlan="Pro Agent"
          bullets={[
            'Listings & lead performance stats',
            '6-month lead trend chart',
            'Paid & pending commission totals',
            'Month-over-month comparisons',
          ]}
        />
      </AppLayout>
    );
  }

  const maxBar = Math.max(...monthlyLeads.map(m => m.count), 1);

  return (
    <AppLayout role={profile?.role || 'realtor'} title="Analytics"
      user={{ name: profile?.full_name || 'User', role: profile?.role || 'realtor', initials: (profile?.full_name || 'U').slice(0, 2).toUpperCase() }}>
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-5xl mx-auto">

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Listings"    value={stats.totalListings}   icon={HiHome}          loading={loading} />
          <StatCard label="Active Listings"   value={stats.activeListings}  icon={HiEye}           loading={loading} />
          <StatCard label="Total Leads"       value={stats.totalLeads}      icon={HiUsers}         loading={loading} />
          <StatCard label="Leads This Month"  value={stats.thisMonthLeads}  icon={HiArrowTrendingUp} loading={loading} />
          <StatCard label="Paid Commissions"  value={`$${stats.totalCommissions.toFixed(2)}`}   icon={HiBanknotes} loading={loading} />
          <StatCard label="Pending Commissions" value={`$${stats.pendingCommissions.toFixed(2)}`} icon={HiBanknotes} loading={loading} />
        </div>

        {/* Lead trend chart */}
        <SectionCard title="Lead Trend — Last 6 Months">
          <div className="px-5 py-5">
            {loading ? (
              <Skeleton width="100%" height="120px" />
            ) : (
              <div className="flex items-end gap-3 h-32">
                {monthlyLeads.map(m => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold" style={{ color: '#111111' }}>{m.count}</span>
                    <div className="w-full rounded-t-lg transition-all"
                      style={{
                        height: `${Math.max(4, (m.count / maxBar) * 100)}px`,
                        background: DEEP,
                        minHeight: 4,
                      }} />
                    <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

      </div>
    </AppLayout>
  );
}
