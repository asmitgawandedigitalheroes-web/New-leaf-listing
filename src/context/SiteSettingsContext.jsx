import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULTS = {
  contact: {
    phone: '1-866-886-3040',
    secondaryPhone: '',
    address: '8 The Green St',
    city: 'Dover',
    state: 'DE',
    zip: '19901',
    businessHours: 'Mon–Fri, 9am – 6pm PST',
  },
  social: {
    facebook: '',
    instagram: 'https://www.instagram.com/nlvlistingz?igsh=MXhnZm50NWJxeHh1YQ%3D%3D&utm_source=qr',
    twitter: '',
    linkedin: 'https://www.linkedin.com/showcase/nlv-listings/about/?viewAsMember=true',
    youtube: '',
    tiktok: '',
  },
  supportEmail: 'support@nlvlistings.com',
};

const SiteSettingsContext = createContext({ ...DEFAULTS, isLoading: true });

const KEYS = ['contact_config', 'social_config', 'support_email'];

export function SiteSettingsProvider({ children }) {
  const [state, setState] = useState({ ...DEFAULTS, isLoading: true });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', KEYS);

      if (cancelled) return;
      if (error || !data) {
        setState(s => ({ ...s, isLoading: false }));
        return;
      }

      const map = data.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
      setState({
        contact: { ...DEFAULTS.contact, ...(map.contact_config || {}) },
        social:  { ...DEFAULTS.social,  ...(map.social_config  || {}) },
        supportEmail: map.support_email || DEFAULTS.supportEmail,
        isLoading: false,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  return <SiteSettingsContext.Provider value={state}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

export function formatAddress(contact) {
  const cityState = [contact.city, contact.state].filter(Boolean).join(', ');
  const cityStateZip = [cityState, contact.zip].filter(Boolean).join(' ').trim();
  return [contact.address, cityStateZip].filter(Boolean).join('\n');
}
