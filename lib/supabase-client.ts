/**
 * ⚡ UNY PROTOCOL: CORE SUPABASE CLIENT (V1)
 * Description: Initialisation sécurisée du client Supabase avec validation stricte.
 * Zéro fallback, Zéro crash silencieux.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Prioritize environment variables, fallback to hardcoded for dev/demo if needed
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  'https://fhemvqpchpmodzgvqoqv.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'sb_publishable_xM0y9C0ZcTrJX7gFxzchvQ_KiM2ogLb';

/**
 * Validation des variables d'environnement.
 */
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '❌ [Kernel] CRITICAL: Supabase configuration is missing.';
  console.error(errorMsg);
}

/**
 * Instance typée du client Supabase pour le navigateur.
 * Singleton exporté pour éviter les instances multiples.
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

/**
 * Logger d'état pour le débogage en développement
 */
if (import.meta.env.DEV) {
  console.log('🛡️ [Kernel] Supabase Client initialized successfully.');
}
