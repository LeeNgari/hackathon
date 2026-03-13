import { createClient } from '@supabase/supabase-js';

// Get environment variables from Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project-ref.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Initialize and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
