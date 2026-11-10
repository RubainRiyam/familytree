# Aalthara — brief for Claude Code

Aalthara (ആൽത്തറ) is a family tree and directory app sold to family associations (kudumbayogams) in Kerala. One admin buys it for the family; every member uses it free. Primary users include people in their seventies. Read this file, then `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/COMPLIANCE.md`, and work through `docs/BUILD_PLAN.md` in order.

## What already exists (do not redo)

| Path | State |
|---|---|
| `supabase/migrations/0001_init.sql` | Complete schema, RLS and RPCs. **Tested** on Postgres 16 by `scripts/test-db.sh` (50 checks, all passing). |
| `supabase/migrations/0002_storage.sql` | Photo bucket and policies. **Not yet run anywhere**; verify on the Supabase project. |
| `supabase/tests/` | Local stubs for `auth` + the smoke test. Extend it whenever the schema changes. |
| `packages/core/kinship.ts` | Kinship-term resolver with tests (`node --test packages/core/kinship.test.ts`). |
| `site/` | Static launch website with Privacy Policy, Terms and account-deletion page. Deploys to Vercel as is. |
| `design/tokens.json`, `design/logo/` | Design tokens (light + dark) and logo SVGs. Source of truth for all colour, type, spacing. |

Everything else (the Expo app, API functions, CI) is yours to build.

## Non-negotiables

1. **Elder-first.** Base text 18px, nothing under 15px, every tap target ≥ 56×56, labels on every control, one primary action per screen, no gesture-only actions, honour system font scale to 160% without truncating names. `docs/DESIGN.md` has the full rules; treat a violation as a bug.
2. **Privacy by construction.** The client only ever uses the Supabase anon key + the user's JWT. All access control is RLS and the SECURITY DEFINER RPCs in `0001_init.sql`. Never add a code path that uses the service-role key on a device or in client-side web code. Never add fields for caste, religion or government IDs.
3. **No ads, no third-party analytics or tracking SDKs.** Crash reporting only, with PII scrubbing.
4. **One account per person, one person across many families.** Never create a second `persons` row for someone who already has one; use `accept_invite`, `decide_join_request` or `merge_duplicate`.
5. **The legal pages are requirements.** Every promise in `site/index.html` (privacy, terms) must be true of the product. The list is in `docs/COMPLIANCE.md` §3.
6. **Fast.** Cold start to usable Home ≤ 2s on a 2019 mid-range Android; search results ≤ 100ms from the local cache; every screen renders from cache first, then refreshes.
7. **Malayalam and English from day one.** No hard-coded strings in components. Malayalam copy needs review by a native speaker before release; mark unreviewed strings in `packages/core/i18n/ml.todo.json`.

## How to work

- Never commit to `main`. One branch and one PR per milestone in `docs/BUILD_PLAN.md`.
- Apply migrations to Supabase with the Supabase MCP `apply_migration` tool (project ref goes in this file once the project exists: `SUPABASE_PROJECT_REF=`). After any schema change: run advisors, regenerate types into `packages/core/database.types.ts`, add assertions to `supabase/tests/01_smoke.sql`, run `scripts/test-db.sh`, commit the migration file.
- Never edit `0001_init.sql` after it has been applied; add a new numbered migration.
- Use current stable versions of Expo, React Native and supabase-js; check their docs rather than assuming APIs from memory.
- Do not add a dependency where a few lines will do. Every native dependency must work in Expo prebuild/EAS.
- Definition of done for a screen: matches the design canvas on both platforms, works at 160% text, works offline from cache, has Malayalam strings, has accessibility labels, has a test for its main action.

## Commands

```bash
scripts/test-db.sh                               # schema + RLS + RPC smoke test on a throwaway local Postgres
node --test packages/core/kinship.test.ts        # kinship resolver
npx vercel deploy site                           # launch website (static; no build step)
```

## Open items only the owner can settle

Company legal name, registered address, grievance officer, support phone and email (fill `SITE` in `site/index.html`); domain; SMS/WhatsApp provider and DLT registration; Razorpay account; Apple and Google developer accounts; final prices; trademark search for "Aalthara"; lawyer review of the legal pages. Ask the owner; do not invent these.
