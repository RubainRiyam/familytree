// Public client configuration. The app and the web build may only ever hold the Supabase URL
// and the anon (publishable) key; this module refuses anything that looks like a secret key so a
// misconfigured build fails loudly instead of shipping a key that bypasses row-level security.

export type PublicConfig = { supabaseUrl: string; supabaseAnonKey: string };
export type ConfigResult =
  | { ok: true; config: PublicConfig }
  | { ok: false; reason: 'missing'; missing: string[] }
  | { ok: false; reason: 'invalid'; problem: string };

export const PUBLIC_ENV = {
  url: 'EXPO_PUBLIC_SUPABASE_URL',
  anonKey: 'EXPO_PUBLIC_SUPABASE_ANON_KEY',
} as const;

function jwtRole(key: string): string | undefined {
  const part = key.split('.')[1];
  if (!part) return undefined;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    const role = (JSON.parse(json) as { role?: unknown }).role;
    return typeof role === 'string' ? role : undefined;
  } catch {
    return undefined;
  }
}

/** True for keys that must never be on a device: legacy service-role JWTs and new-style secret keys. */
export function isSecretKey(key: string): boolean {
  return key.startsWith('sb_secret_') || jwtRole(key) === 'service_role';
}

export function parsePublicConfig(env: Record<string, string | undefined>): ConfigResult {
  const url = env[PUBLIC_ENV.url]?.trim() ?? '';
  const key = env[PUBLIC_ENV.anonKey]?.trim() ?? '';
  const missing: string[] = [];
  if (!url) missing.push(PUBLIC_ENV.url);
  if (!key) missing.push(PUBLIC_ENV.anonKey);
  if (missing.length) return { ok: false, reason: 'missing', missing };
  if (isSecretKey(key)) return { ok: false, reason: 'invalid', problem: `${PUBLIC_ENV.anonKey} is a secret key` };
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'invalid', problem: `${PUBLIC_ENV.url} is not a URL` };
  }
  const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.protocol !== 'https:' && !local) {
    return { ok: false, reason: 'invalid', problem: `${PUBLIC_ENV.url} must use https` };
  }
  return { ok: true, config: { supabaseUrl: url.replace(/\/+$/, ''), supabaseAnonKey: key } };
}
