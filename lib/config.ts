import { getRequiredEnv } from '@/lib/env';

export const CONFIG = {
  AI_MODEL: process.env.AI_MODEL || 'gemini-2.5-flash',
  SUPABASE_URL: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
  SUPABASE_ANON_KEY: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
};
