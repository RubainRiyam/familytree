# Aalthara · ആൽത്തറ

The family tree and directory for Kerala family associations. *The whole family, under one tree.*

Start with `CLAUDE.md`. What is here:

- `site/` — launch website, Privacy Policy, Terms, account-deletion page. Static; deploy with `npx vercel deploy site`.
- `supabase/` — database schema with row-level security and RPCs, plus tests. Run `scripts/test-db.sh` (needs local Postgres 15+ binaries).
- `packages/core/` — kinship-term resolver and tests: `node --test packages/core/kinship.test.ts` (Node 22.18+).
- `design/` — tokens and logo.
- `docs/` — PRD, architecture, design rules, compliance notes, build plan.

The mobile app itself is not built yet; `docs/BUILD_PLAN.md` is the order to build it in.
