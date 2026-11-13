import { createClient } from '@supabase/supabase-js';

// Sanitize the URL in case /rest/v1 or trailing slashes/spaces were copied
const cleanUrl = (url) => {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
};

const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawEnvKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseUrl = cleanUrl(rawEnvUrl) || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = rawEnvKey.trim() || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  rawEnvUrl &&
  rawEnvKey &&
  !rawEnvUrl.includes('your-project-ref') &&
  !rawEnvUrl.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
