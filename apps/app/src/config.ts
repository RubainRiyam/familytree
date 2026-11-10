import { parsePublicConfig } from '@aalthara/core/config';

// Expo inlines EXPO_PUBLIC_* at build time only when they are read as literal property accesses.
export const publicConfig = parsePublicConfig({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
});
