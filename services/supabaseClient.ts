
import { createClient } from '@supabase/supabase-js';

// Environment variables are injected by Vite via the 'define' config
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
