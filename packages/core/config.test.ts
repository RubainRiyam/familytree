import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSecretKey, parsePublicConfig } from './config.ts';

const jwt = (payload: object) =>
  ['e30', Buffer.from(JSON.stringify(payload)).toString('base64url'), 'sig'].join('.');

test('missing values are reported by name', () => {
  assert.deepEqual(parsePublicConfig({}), {
    ok: false, reason: 'missing', missing: ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'],
  });
});

test('secret keys are refused', () => {
  assert.equal(isSecretKey(jwt({ role: 'service_role' })), true);
  assert.equal(isSecretKey('sb_secret_abc'), true);
  assert.equal(isSecretKey(jwt({ role: 'anon' })), false);
  assert.equal(isSecretKey('sb_publishable_abc'), false);
  const r = parsePublicConfig({ EXPO_PUBLIC_SUPABASE_URL: 'https://x.supabase.co', EXPO_PUBLIC_SUPABASE_ANON_KEY: jwt({ role: 'service_role' }) });
  assert.equal(r.ok, false);
});

test('http is refused except for local development', () => {
  const key = 'sb_publishable_abc';
  assert.equal(parsePublicConfig({ EXPO_PUBLIC_SUPABASE_URL: 'http://x.supabase.co', EXPO_PUBLIC_SUPABASE_ANON_KEY: key }).ok, false);
  assert.equal(parsePublicConfig({ EXPO_PUBLIC_SUPABASE_URL: 'http://localhost:54321', EXPO_PUBLIC_SUPABASE_ANON_KEY: key }).ok, true);
});

test('a good config is normalised', () => {
  assert.deepEqual(parsePublicConfig({ EXPO_PUBLIC_SUPABASE_URL: ' https://x.supabase.co/ ', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_abc' }), {
    ok: true, config: { supabaseUrl: 'https://x.supabase.co', supabaseAnonKey: 'sb_publishable_abc' },
  });
});
