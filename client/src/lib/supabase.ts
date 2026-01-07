import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️  Supabase credentials not configured properly.');
  console.error('Required environment variables:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
  console.error('Please set these in Vercel Dashboard → Project Settings → Environment Variables');
  console.error('Then redeploy the application.');
  throw new Error('Missing required Supabase environment variables. Check console for details.');
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch (e) {
  console.error('❌ Invalid VITE_SUPABASE_URL format. Must be a valid HTTP or HTTPS URL.');
  console.error(`Current value: "${supabaseUrl}"`);
  throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
