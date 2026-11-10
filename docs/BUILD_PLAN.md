# Aalthara — build plan

One branch and one PR per milestone. Each ends with: tests green, both platforms run, Malayalam strings present, demo recorded.

| # | Milestone | Contents | Done when |
|---|---|---|---|
| 0 | Foundations | pnpm workspace; `apps/app` (Expo, Expo Router, TypeScript strict); `packages/ui` theme generated from `design/tokens.json` (light + dark); fonts bundled (Anek Malayalam, Atkinson Hyperlegible Next); i18n scaffold (en, ml); CI (typecheck, lint, `scripts/test-db.sh`, `node --test`); Supabase project in Mumbai, migrations applied, types generated; `site/` deployed to Vercel | A blank themed app runs on iOS, Android and web; CI is green; the site is live on a preview URL |
| 1 | Components | Button, PersonDisc, PersonRow, TextField, FactChip, TabBar (iOS + Android variants), Card, Sheet/Dialog, app bar, FAB, empty/error/offline states; a gallery screen | Gallery matches the design system in both themes and at 160% text; VoiceOver/TalkBack labels verified |
| 2 | Sign-in and onboarding | Phone OTP with Send-SMS hook; language choice; consent notice; `register_self`; invite deep links (`accept_invite`); family code (`request_join`); start a family (`create_family`) | New user with an invite link reaches Home in ≤ 90 seconds on both platforms |
| 3 | Local-first data | SQLite schema mirroring the read model; initial sync, delta sync, tombstones; outbox with retry; sign-out wipe | Airplane-mode demo: browse, search, add a relative, reconnect, see it synced |
| 4 | Tree and Add a relative | Walk-the-tree view; add slots; `add_relative` flows for all six relations; partner history; adoption/step kinds; under-18 handling | The PRD §3.3 cases all enterable and correctly drawn |
| 5 | Find and Person | FTS search, fact chips from facets, person screen, call/WhatsApp intents, contact visibility, edit my details, photo upload | "Who is in Dubai" answers in < 100ms on a 1,500-person seed family |
| 6 | Kinship | Device-side path finding; `kinship.ts` terms; "How are we related?"; per-family overrides | 40 hand-checked relation cases pass, reviewed by a Malayalam speaker |
| 7 | Many families | Family switcher; My families; merge on invite; admin duplicate detection and merge | The smoke-test scenario (Leela in two families) works end to end in the UI |
| 8 | Events and notifications | Events, RSVP, notices; Expo push; birthday/event reminder cron | Reminder arrives on both platforms; can be turned off |
| 9 | Admin and billing | Join requests, roles, branches, member-additions setting; Razorpay order + webhook; billing sweep; read-only state UI; PDF/CSV directory export | Test-mode payment activates a family; lapse makes it read-only; PDF prints as a booklet |
| 10 | Privacy and my data | Download my data, withdraw consent, nominate, delete account; "you were added" notice and no-account removal page; inactive sweep | Every row of COMPLIANCE §3 demonstrably true |
| 11 | Tablet and web | Two-pane layouts ≥ 840px; left rail; web export under `/app`; keyboard navigation | Usable on an iPad, an Android tablet and desktop Chrome/Safari |
| 12 | Hardening and launch | Performance budgets; 160% text screenshot sweep; accessibility audit; penetration test fixes; five sessions with users 65+; store listings, privacy labels, review notes; production DLT templates; incident runbook | Submitted to both stores; first paying family onboarded |

Seed data for development: a 1,500-person, 6-generation synthetic family (script in `scripts/seed.ts`, to write) with three branches, remarriages, adoptions, deceased members, and 20 people shared with a second family.
