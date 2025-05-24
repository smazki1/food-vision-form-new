import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("VITE_SUPABASE_URL is not set in environment variables.");
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("VITE_SUPABASE_SERVICE_ROLE_KEY is not set in environment variables.");
}

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    // It's recommended to set detectSessionInUrl to false for service role client
    // if you don't expect it to handle session recovery from URL
    detectSessionInUrl: false 
  }
}); 