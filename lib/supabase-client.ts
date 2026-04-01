/**
 * ⚡ UNY PROTOCOL: CORE SUPABASE CLIENT (V1)
 * Description: Secure Supabase client initialization with strict validation.
 * Zero fallback credentials, zero silent failures.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Strict validation: no hardcoded credentials.
 * Application will fail fast if environment is misconfigured.
 */
if (!supabaseUrl) {
  throw new Error(
    '❌ [Kernel] CRITICAL: VITE_SUPABASE_URL is missing. ' +
    'Set it in your .env file. See .env.example for reference.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ [Kernel] CRITICAL: VITE_SUPABASE_ANON_KEY is missing. ' +
    'Set it in your .env file. See .env.example for reference.'
  );
}

/**
 * Typed Supabase client instance (browser singleton).
 * Configured with session persistence and automatic token refresh.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

if (import.meta.env.DEV) {
  console.log('🛡️ [Kernel] Supabase Client initialized successfully.');
}
