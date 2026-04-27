import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNav from '../../components/layout/PublicNav';
import PublicFooter from '../../components/layout/PublicFooter';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useListing } from '../../hooks/useListing';
import { useLeads } from '../../hooks/useLeads';
import {
  HiMapPin,
  HiArrowLeft,
  HiHome,
  HiPhone,
  HiEnvelope,
} from 'react-icons/hi2';

const GOLD   = '#D4AF37';
const DEEP   = '#1F4D3A';
const OS     = '#111111';
const OSV    = '#4B5563';
const LGRAY  = '#6B7280';
const BORDER = '#E5E7EB';
const SURF   = '#F9FAFB';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80';

function StatBox({ label, value }) {
  return (
    <div
      style={{
        background: SURF,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: '12px 16px',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: LGRAY, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: OS }}>
        {value}
      </div>
    </div>
  );
}

export default function PublicListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { profile } = useAuth();
  const { listing, isLoading, error } = useListing(id);
  const { createInquiry } = useLeads();

  const [mapCoords, setMapCoords] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [isContactLoading, setIsContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    interest: 'Buying',
  });

  // Geocode address → OpenStreetMap coords via Nominatim (no API key required)
  useEffect(() => {
    if (!listing) return;
    const q = [listing.address, listing.city, listing.state, listing.country]
      .filter(Boolean).join(', ');
    if (!q) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, {
      headers: { 'Accept-Language': 'en' },
    })
      .then(r => r.json())
      .then(data => {
        if (data[0]) {
          setMapCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        }
      })
      .catch(() => {});
  }, [listing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill if signed in
  useEffect(() => {
    if (profile) {
      setContactForm(prev => ({
        ...prev,
        name: profile.full_name || '',
        email: profile.email || '',
      }));
    }
  }, [profile]);

  const handleContactAgent = async () => {
    if (!contactForm.name.trim() || !contactForm.email.trim()) {
      addToast({ type: 'error', title: 'Missing info', desc: 'Name and email are required.' });
      return;
    }
    setIsContactLoading(true);
    try {
      const { error: leadError } = await createInquiry({
        listing_id: listing.id,
        source: 'website',
        name: contactForm.name,
        email: contactForm.email,
        phone: contactForm.phone,
        message: contactForm.message,
        interest: contactForm.interest,
        territory_id: listing.territory_id,
        status: 'new',
      });
      if (leadError) throw leadError;
      addToast({ type: 'success', title: 'Request sent!', desc: 'The listing agent will be in touch shortly.' });
      setContactModalOpen(false);
      setContactForm(prev => ({ ...prev, message: '', phone: '' }));
    } catch (err) {
      addToast({ type: 'error', title: 'Could not send request', desc: 'Please try again or contact support.' });
    } finally {
      setIsContactLoading(false);
    }
  };

  const imgSrc = listing?.images?.[0] || FALLBACK_IMAGE;
  const isInactive = listing?.status === 'sold' || listing?.status === 'expired';

  const agentInitials = listing?.realtor?.full_name
    ? listing.realtor.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AG';

  return (
    <div className="min-h-screen" style={{ background: '#F7F8FA' }}>
      <PublicNav />

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-20">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium mb-6 transition-colors hover:opacity-70"
          style={{ color: LGRAY }}
        >
          <HiArrowLeft size={16} />
          Back to Listings
        </button>

        {error ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-gray-500 font-medium">Error loading listing.</p>
          </div>
        ) : !isLoading && !listing ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-gray-500 font-medium">Listing not found.</p>
          </div>
        ) : (
          <>
            {/* ── Hero image + info panel ── */}
            <div className="grid lg:grid-cols-5 gap-6 mb-6">

              {/* Image */}
              <div className="lg:col-span-3">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ height: 320, background: '#E5E7EB' }}
                >
                  {isLoading ? (
                    <Skeleton width="100%" height="100%" />
                  ) : (
                    <img
                      src={imgSrc}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = FALLBACK_IMAGE; }}
                    />
                  )}
                </div>
              </div>

              {/* Info panel */}
              <div
                className="lg:col-span-2 flex flex-col rounded-2xl p-6"
                style={{ background: '#fff', border: `1px solid ${BORDER}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
              >
                {/* Status */}
                <div className="mb-3">
                  {isLoading ? <Skeleton width="70px" height="22px" /> : <Badge status={listing.status} />}
                </div>

                {/* Title */}
                {isLoading ? (
                  <>
                    <Skeleton width="90%" height="26px" className="mb-2" />
                    <Skeleton width="65%" height="16px" className="mb-4" />
                    <Skeleton width="140px" height="38px" className="mb-6" />
                  </>
                ) : (
                  <>
                    <h1 className="font-bold leading-snug mb-1" style={{ fontSize: 22, color: OS }}>
                      {listing.title}
                    </h1>
                    <div className="flex items-center gap-1 mb-4" style={{ color: LGRAY }}>
                      <HiMapPin size={13} className="flex-shrink-0" />
                      <span className="text-sm truncate">{listing.address}{listing.city ? `, ${listing.city}` : ''}</span>
                    </div>
                    <div className="font-black mb-6" style={{ fontSize: 30, color: OS }}>
                      {listing.price ? `$${Number(listing.price).toLocaleString()}` : 'Price on request'}
                    </div>
                  </>
                )}

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {isLoading ? (
                    [...Array(4)].map((_, i) => <Skeleton key={i} width="100%" height="52px" />)
                  ) : (
                    <>
                      <StatBox label="Bedrooms"    value={listing.bedrooms  != null ? `${listing.bedrooms} bd`  : 'N/A'} />
                      <StatBox label="Bathrooms"   value={listing.bathrooms != null ? `${listing.bathrooms} ba` : 'N/A'} />
                      <StatBox label="Square Feet" value={listing.sqft      != null ? Number(listing.sqft).toLocaleString() : 'N/A'} />
                      <StatBox label="Type"        value={listing.property_type || 'N/A'} />
                    </>
                  )}
                </div>

                {/* Contact CTA */}
                <button
                  disabled={isLoading || isInactive}
                  onClick={isInactive ? undefined : () => setContactModalOpen(true)}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background:  isInactive ? '#E5E7EB' : GOLD,
                    color:       isInactive ? LGRAY     : '#fff',
                    cursor:      isInactive ? 'default' : 'pointer',
                    boxShadow:   isInactive ? 'none'    : '0 4px 14px rgba(212,175,55,0.35)',
                  }}
                  onMouseEnter={e => { if (!isInactive) e.currentTarget.style.background = '#B8962E'; }}
                  onMouseLeave={e => { if (!isInactive) e.currentTarget.style.background = GOLD; }}
                >
                  {isInactive ? 'Listing Inactive' : 'Contact Agent'}
                </button>
              </div>
            </div>

            {/* ── Description ── */}
            <div
              className="rounded-2xl p-6 mb-5"
              style={{ background: '#fff', border: `1px solid ${BORDER}` }}
            >
              <h2 className="font-bold mb-3" style={{ fontSize: 15, color: OS }}>Description</h2>
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton width="100%" height="14px" />
                  <Skeleton width="100%" height="14px" />
                  <Skeleton width="70%"  height="14px" />
                </div>
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: OSV }}>
                  {listing.description ||
                    `This ${listing.bedrooms ?? ''}‑bedroom, ${listing.bathrooms ?? ''}‑bathroom property located in ${listing.city} offers premium finishes throughout.`}
                </p>
              )}
            </div>

            {/* ── Location Map ── */}
            <div
              className="rounded-2xl p-6 mb-5"
              style={{ background: '#fff', border: `1px solid ${BORDER}` }}
            >
              <h2 className="font-bold mb-3 flex items-center gap-2" style={{ fontSize: 15, color: OS }}>
                <HiMapPin size={16} style={{ color: GOLD }} />
                Location
              </h2>
              {isLoading ? (
                <Skeleton width="100%" height="220px" />
              ) : mapCoords ? (
                <div className="overflow-hidden rounded-xl" style={{ height: 220 }}>
                  <iframe
                    title="Property location map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.lng - 0.012},${mapCoords.lat - 0.008},${mapCoords.lng + 0.012},${mapCoords.lat + 0.008}&layer=mapnik&marker=${mapCoords.lat},${mapCoords.lng}`}
                    width="100%"
                    height="220"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  className="flex items-center justify-center rounded-xl text-sm"
                  style={{ height: 220, background: SURF, color: LGRAY, border: `1px dashed ${BORDER}` }}
                >
                  <div className="text-center">
                    <HiMapPin size={28} className="mx-auto mb-2 opacity-30" />
                    <p>{[listing?.address, listing?.city, listing?.state].filter(Boolean).join(', ') || 'Location not available'}</p>
                  </div>
                </div>
              )}
              {listing?.address && (
                <p className="text-xs mt-3 flex items-center gap-1" style={{ color: LGRAY }}>
                  <HiMapPin size={11} />
                  {[listing.address, listing.city, listing.state, listing.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* ── Listing Agent ── */}
            <div
              className="rounded-2xl p-6 flex items-center gap-4"
              style={{ background: '#fff', border: `1px solid ${BORDER}` }}
            >
              <h2 className="sr-only">Listing Agent</h2>
              {isLoading ? (
                <>
                  <Skeleton variant="circle" width="52px" height="52px" />
                  <div className="flex-1">
                    <Skeleton width="130px" height="14px" className="mb-2" />
                    <Skeleton width="180px" height="12px" />
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${DEEP})` }}
                  >
                    {agentInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: OS }}>
                      {listing.realtor?.full_name || 'Agent'}
                    </p>
                    <p className="text-xs" style={{ color: LGRAY }}>Licensed Real Estate Agent</p>
                  </div>
                  <button
                    disabled={isInactive}
                    onClick={isInactive ? undefined : () => setContactModalOpen(true)}
                    className="px-5 py-2 rounded-xl text-sm font-bold transition-all flex-shrink-0"
                    style={{
                      background:  isInactive ? '#E5E7EB' : DEEP,
                      color:       isInactive ? LGRAY     : '#fff',
                      cursor:      isInactive ? 'default' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!isInactive) e.currentTarget.style.background = '#163A2B'; }}
                    onMouseLeave={e => { if (!isInactive) e.currentTarget.style.background = DEEP; }}
                  >
                    {isInactive ? 'Inactive' : 'Contact Agent'}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Contact Agent Modal ── */}
      <Modal
        open={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title={`Inquiry for ${listing?.title || 'this listing'}`}
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="ghost" onClick={() => setContactModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleContactAgent} isLoading={isContactLoading}>
              Send Inquiry
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Your Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm"
                value={contactForm.name}
                onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm"
                value={contactForm.email}
                onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm"
                value={contactForm.phone}
                onChange={e => setContactForm({ ...contactForm, phone: e.target.value.replace(/[^0-9+\-\s()]/g, '').slice(0, 20) })}
                placeholder="(555) 000-0000"
                maxLength={20}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">I'm interested in</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm bg-white"
                value={contactForm.interest}
                onChange={e => setContactForm({ ...contactForm, interest: e.target.value })}
              >
                <option value="Buying">Buying</option>
                <option value="Renting">Renting</option>
                <option value="Investing">Investing</option>
                <option value="More Info">More Info</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Message</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:outline-none text-sm min-h-[100px] resize-none"
              value={contactForm.message}
              onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
              placeholder="I'm interested in this property and would like to schedule a viewing…"
            />
          </div>
        </div>
      </Modal>

      <PublicFooter />
    </div>
  );
}
