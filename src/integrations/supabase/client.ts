// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

// Use Vite environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug logging
console.log('[SUPABASE_CLIENT] Environment variables:', {
  url: SUPABASE_URL,
  hasKey: !!SUPABASE_PUBLISHABLE_KEY,
  keyLength: SUPABASE_PUBLISHABLE_KEY?.length,
  keyStart: SUPABASE_PUBLISHABLE_KEY?.substring(0, 20),
  keyEnd: SUPABASE_PUBLISHABLE_KEY?.substring(SUPABASE_PUBLISHABLE_KEY.length - 20)
});

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('[SUPABASE_CLIENT] Missing environment variables:', {
    VITE_SUPABASE_URL: SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: SUPABASE_PUBLISHABLE_KEY
  });
  throw new Error("Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.");
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Set session to persist indefinitely - prevent automatic logout
    persistSession: true,
    // Enable automatic token refresh to prevent expiry
    autoRefreshToken: true,
    // Prevent session detection from causing timeouts
    detectSessionInUrl: false
  }
});