import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const getCookieDomain = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // For local testing, just return empty string to use default behavior
    if (hostname === 'localhost' || hostname === '127.0.0.1') return '';
    
    // For production, share across all subdomains
    if (hostname.includes('xyz-sa.site')) {
      return '.xyz-sa.site'; 
    }
    return hostname;
  }
  return '';
};

// Custom storage using document.cookie to share session across subdomains
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    const domain = getCookieDomain();
    const domainAttr = domain ? `domain=${domain}; ` : '';
    document.cookie = `${key}=${encodeURIComponent(value)}; ${domainAttr}path=/; max-age=31536000; SameSite=Lax; Secure`;
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    const domain = getCookieDomain();
    const domainAttr = domain ? `domain=${domain}; ` : '';
    document.cookie = `${key}=; ${domainAttr}path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    storageKey: 'xyz-auth-token',
  }
});
