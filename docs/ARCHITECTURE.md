# Aalthara — architecture

## 1. Shape

```
aalthara/
├─ apps/app/            Expo (React Native) app: iOS, Android, tablets, and web via react-native-web   ← to build
├─ site/                Static launch site + legal pages (done). Add /api here for Vercel Functions     ← api to build
├─ packages/core/       Pure TypeScript shared by app and api: kinship, i18n, validation, types
├─ packages/ui/         Tokens → theme, and the components from the design system                       ← to build
├─ supabase/            Migrations and DB tests (done)
├─ design/              tokens.json, logo
└─ docs/
```

- **One UI codebase, two manners.** Expo Router with platform files (`TabBar.ios.tsx` / `TabBar.android.tsx`, etc.) for the differences listed in `docs/DESIGN.md`. Web is the same app exported statically and served by Vercel at `/app`.
- **Backend is Supabase** (Postgres, Auth, Storage) in the Mumbai region. The database is the security boundary: clients talk to it directly with the anon key + user JWT under RLS.
- **Vercel Functions** (in `site/api/`, Node runtime, Mumbai region) do only what needs a secret: payments, sending invite messages, PDF export, account deletion, scheduled jobs.
- Git-driven: push → Vercel preview per PR; `main` → production. Mobile builds through EAS (`eas build`, `eas submit`), OTA updates for JS-only fixes.

Why this and not Next.js for the app: the product is mobile-first with platform-specific manners; one React Native codebase gives real native apps plus a web build, and the marketing site stays a zero-build static page that cannot break.

## 2. Data model (see `supabase/migrations/0001_init.sql`)

- `persons` — one row per human, global, with or without an account. `claimed_by` (unique) ties it to at most one auth user, which is how "one account per person" is enforced.
- `person_contacts` — phone, WhatsApp, email, address, with `visibility` (family / admins / hidden). Separate table so RLS can be stricter than the profile's.
- `families`, `family_members` (role, status, branch), `branches`, `family_billing`.
- `parent_child` (biological / adoptive / step / foster / guardian) and `partnerships` (current / widowed / divorced / separated). **Only these two relationships are stored.** Siblings, grandparents, cousins and in-laws are derived. This is what lets the model hold every real family: remarriage, half-siblings, adoption, a person in several families, two families joined by a marriage.
- `invites`, `join_requests`, `events`, `event_rsvps`.
- `consents`, `data_requests`, `audit_log`, `tombstones`, `payments`.

RPCs the app calls: `register_self`, `create_family`, `add_relative`, `accept_invite`, `family_by_code`, `request_join`, `decide_join_request`, `merge_duplicate`, `search_people`, `family_facets`, `relation_path`, `erase_my_data`. Plain table reads/writes cover the rest.

Guards in the database, not the client: no ancestor cycles; parent born before child; no contact details for under-18s; a family always has an owner; member limit; read-only when the licence lapses; `claimed_by` changes only inside RPCs.

## 3. Speed: local-first

- On first open of a family the app downloads its people, links and memberships (a 1,500-person family is well under 1 MB) into **SQLite on the device** (expo-sqlite), then keeps it fresh with `updated_at > last_sync` pulls and `tombstones` for deletions. Realtime subscription optional later; pull on foreground + pull-to-refresh is enough for v1.
- Every screen reads from SQLite, so navigation and search never wait on the network. Search uses SQLite FTS5 with a trigram tokenizer over the same fields as `search_text`.
- Writes go through an outbox: applied optimistically to SQLite, sent as RPC calls, retried with backoff, surfaced plainly if they fail ("Couldn't save Vinod's number. Try again.").
- Tree walking and `relation_path` run on the device over the cached links (BFS, same algorithm as the SQL function).
- Photos: upload a 1024px JPEG + 256px thumbnail; lists use thumbnails only; expo-image with disk cache.
- Lists use a virtualised list (FlashList). Hermes on. No JS-thread animation on lists.
- Budgets: cold start to interactive Home ≤ 2s (Pixel 4a class); app download ≤ 30 MB; JS bundle ≤ 3 MB.
- The local database holds personal data: store it in the app's private directory, exclude it from device backups, and wipe it on sign-out.

## 4. Auth

Supabase Auth, phone OTP. Use the **Send SMS hook** so one function can route +91 numbers to an Indian DLT-registered provider and other countries (the Gulf matters) to an international one, and fall back to WhatsApp. Session in secure storage (expo-secure-store). Rate-limit OTP requests per number and per IP; enable Supabase's CAPTCHA option on web. 6-digit codes, 10-minute expiry.

## 5. Server functions (`site/api/`)

| Route | Does |
|---|---|
| `POST /api/pay/order` | Admin JWT → creates a Razorpay order for licence or renewal; writes `payments(status=created)` |
| `POST /api/pay/webhook` | Verifies the Razorpay signature; marks paid; updates `family_billing` (plan, status, member_limit, renews_on). Idempotent on `provider_payment_id` |
| `POST /api/invite/send` | Member JWT → sends the invite by WhatsApp/SMS, and the "you were added" notice required by the privacy policy |
| `GET  /api/export/directory` | Admin JWT → PDF booklet and CSV, generated server-side, streamed, never stored |
| `GET  /api/export/me` | User JWT → that user's data as JSON (right of access) |
| `POST /api/account/delete` | User JWT → `erase_my_data()` then `auth.admin.deleteUser` |
| cron: `billing-sweep` (daily) | trial → lapsed, active → grace → lapsed by date; renewal reminders 30/7/1 days before |
| cron: `reminders` (daily 7am IST) | Birthday and event pushes via Expo push |
| cron: `inactive-sweep` (weekly) | 3-year inactivity notice (48 hours ahead) then erasure; purge resolved `data_requests` and old `tombstones` |

Each function verifies the caller's JWT with Supabase, then acts with the service role for the narrowest possible query. Secrets live only in Vercel environment variables: `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, SMS provider keys, `CRON_SECRET`.

## 6. Security checklist

- RLS on every table (done; tested). CI runs `scripts/test-db.sh` and fails the build on any policy regression. Add a test for every new policy.
- No service-role key outside Vercel Functions. A lint rule/grep in CI blocks `SERVICE_ROLE` under `apps/`.
- Storage bucket private; signed URLs only; policies in `0002_storage.sql`.
- Input validated twice: zod in `packages/core` and CHECK constraints in the schema.
- Website CSP and security headers set in `site/vercel.json`.
- Supabase: MFA on every dashboard account; restrict dashboard access; point-in-time recovery on; daily backups; database in `ap-south-1`.
- Logs: no phone numbers or names in application logs; keep access logs one year.
- Dependency audit in CI; pin versions; Renovate weekly.
- Pre-launch: an external penetration test of the RLS model and the payment webhook.

## 7. Store and platform notes

- No purchase UI in the apps; licences are sold to associations on the website. Before submission, check this against the current App Store Review Guideline 3.1 and Google Play's payments policy and be ready to explain the model in review notes.
- Both stores require in-app account deletion and a public deletion URL: `/delete-account` exists on the site.
- Data-safety / privacy-label answers come from `docs/COMPLIANCE.md` §2.
- iOS: follow the current system tab bar behaviour rather than fighting it; Android: edge-to-edge and predictive back.

## 8. Testing

- DB: `supabase/tests` (extend).
- Core: `node --test` for kinship, validation, search-query parsing, sync merge logic.
- App: component tests for the design-system components; Maestro flows for sign-in → add relative → find → call on both platforms; an accessibility pass with TalkBack and VoiceOver; a 160% font-scale screenshot run of every screen.
- Before release: five moderated sessions with people aged 65+.
