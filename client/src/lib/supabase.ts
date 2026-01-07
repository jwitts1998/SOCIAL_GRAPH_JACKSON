import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging (will be removed in production by minification)
console.log('[Supabase Config] VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined');
console.log('[Supabase Config] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : 'undefined');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️  Supabase credentials not configured properly.');
  console.error('Required environment variables:');
  console.error('  - VITE_SUPABASE_URL:', supabaseUrl || '❌ MISSING');
  console.error('  - VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ MISSING');
  console.error('Please set these in Vercel Dashboard → Project Settings → Environment Variables');
  console.error('Then redeploy the application.');
  throw new Error('Missing required Supabase environment variables. Check console for details.');
}

// Validate URL format - trim whitespace in case of accidental spaces
const trimmedUrl = supabaseUrl.trim();
if (!trimmedUrl) {
  console.error('❌ VITE_SUPABASE_URL is empty after trimming whitespace');
  throw new Error('VITE_SUPABASE_URL is empty');
}

try {
  new URL(trimmedUrl);
} catch (e) {
  console.error('❌ Invalid VITE_SUPABASE_URL format. Must be a valid HTTP or HTTPS URL.');
  console.error(`Current value: "${trimmedUrl}"`);
  console.error(`Type: ${typeof trimmedUrl}, Length: ${trimmedUrl.length}`);
  throw new Error(`Invalid VITE_SUPABASE_URL format: ${trimmedUrl}`);
}

export const supabase = createClient(trimmedUrl, supabaseAnonKey.trim(), {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
