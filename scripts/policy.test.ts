// Mechanical checks for the non-negotiables in CLAUDE.md. Run with the rest: pnpm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
  .split('\n').filter(Boolean);
const read = (f: string) => readFileSync(root + f, 'utf8');

// Ads, analytics, attribution and tracking SDKs. Crash reporting is allowed (with PII scrubbing).
const DENIED = [
  /^@react-native-firebase\/(analytics|in-app-messaging|dynamic-links)$/, /^firebase$/, /^expo-firebase-analytics$/,
  /google-mobile-ads/, /^expo-ads/, /admob/i, /^react-native-fbsdk/, /facebook/i, /^@segment\//, /amplitude/i,
  /mixpanel/i, /posthog/i, /appsflyer/i, /^react-native-branch$/, /adjust/i, /^@datadog\/.*rum/, /clevertap/i,
  /moengage/i, /webengage/i, /^expo-tracking-transparency$/, /hotjar/i, /^@vercel\/analytics$/, /google-analytics/i,
];

test('no ad, analytics or tracking dependencies', () => {
  for (const f of files.filter((f) => f.endsWith('package.json'))) {
    const pkg = JSON.parse(read(f));
    for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies })) {
      assert.ok(!DENIED.some((re) => re.test(dep)), `${f}: ${dep} is a tracking/ads SDK`);
    }
  }
  if (files.includes('pnpm-lock.yaml')) {
    const names = [...read('pnpm-lock.yaml').matchAll(/^ {2}'?((?:@[^/\s]+\/)?[^@\s':]+)@/gm)].map((m) => m[1] ?? '');
    for (const n of names) assert.ok(!DENIED.some((re) => re.test(n)), `pnpm-lock.yaml pulls in ${n}`);
  }
});

test('no secret keys referenced in client code or app config', () => {
  const client = files.filter((f) => /^(apps\/|packages\/ui\/)/.test(f) && /\.(ts|tsx|js|json)$/.test(f));
  for (const f of client) assert.doesNotMatch(read(f), /service_role|SERVICE_ROLE|sb_secret_/, f);
});

test('only .env.example files are committed', () => {
  for (const f of files) {
    const base = f.split('/').pop() ?? '';
    if (base.startsWith('.env')) assert.equal(base, '.env.example', `${f} must not be committed`);
  }
});

test('platform-specific modules are imported without an extension', () => {
  // Metro picks Foo.web.ts / Foo.ios.tsx only for an extensionless import of './Foo'.
  const split = new Set(files.filter((f) => /\.(web|ios|android|native)\.tsx?$/.test(f))
    .map((f) => (f.split('/').pop() ?? '').replace(/\.(web|ios|android|native)\.tsx?$/, '')));
  for (const f of files.filter((f) => /\.(ts|tsx)$/.test(f))) {
    for (const m of read(f).matchAll(/from\s+'(\.[^']*\/)([^/']+)\.tsx?'/g)) {
      assert.ok(!split.has(m[2] ?? ''), `${f} imports ${m[1]}${m[2]} with an extension; drop it`);
    }
  }
});

test('the schema has no caste, religion or government-ID fields', () => {
  for (const f of files.filter((f) => /^supabase\/migrations\/.*\.sql$/.test(f))) {
    const sql = read(f).replace(/--.*$/gm, '');
    assert.doesNotMatch(sql, /\b(caste|religion|jati|aadhaa?r|pan_(no|number)|passport|voter_id)\b/i, f);
  }
});

test('0001_init.sql is unchanged (add new numbered migrations instead)', () => {
  // Pinned to the reviewed, tested version. If this fails, revert the edit and write 000N_*.sql.
  const sha = execFileSync('git', ['hash-object', 'supabase/migrations/0001_init.sql'], { cwd: root, encoding: 'utf8' }).trim();
  assert.equal(sha, PINNED_0001);
});
const PINNED_0001 = 'c4fef03f9b540f9282aa6058b11ec0cf0720c024';
