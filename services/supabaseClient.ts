import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// These environment variables should be set in your deployment environment
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);