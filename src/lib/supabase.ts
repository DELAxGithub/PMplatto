import { createClient } from '@supabase/supabase-js';

// Get environment variables based on context
const getEnvVar = (key: string): string => {
  // For Node.js context (when running scripts)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  
  // For Vite/browser context
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }

  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.`);
}

// Debug: Log correct Supabase URL to verify configuration
console.log('🔧 PMplatto Supabase URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);