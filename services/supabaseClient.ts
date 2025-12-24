
import { createClient } from '@supabase/supabase-js';

// Environment variables are injected by Vite via the 'define' config in vite.config.ts
// These values MUST be set in Vercel Project Settings > Environment Variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
