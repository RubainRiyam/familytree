# Aalthara — compliance notes

Not legal advice. Have an Indian technology lawyer review this file and the legal pages in `site/index.html` before launch.

## 1. Law that applies

| Law | What it means for Aalthara |
|---|---|
| **Digital Personal Data Protection Act, 2023** and **DPDP Rules, 2025** (notified 13 November 2025, in force in phases: Board provisions at once, consent managers from November 2026, the main duties on notice, consent, security, breach reporting, children's data and rights from **May 2027**) | Build to the full standard now. Itemised notice before consent; consent that can be withdrawn as easily as given; reasonable security safeguards; breach intimation to affected people and the Data Protection Board, with a detailed report within 72 hours; verifiable parental consent before processing a child's (under 18) data and no tracking or targeted advertising of children; rights of access, correction, erasure, grievance redress (within 90 days at most) and nomination; published contact for data questions. |
| Information Technology Act, 2000 and the 2011 "reasonable security practices" (SPDI) rules | In force until the DPDP regime fully replaces them: published privacy policy, consent for sensitive data, a named Grievance Officer. |
| IT (Intermediary Guidelines) Rules, 2021 | Members post content (profiles, notices), so publish terms, name a Grievance Officer, acknowledge complaints within 24 hours and resolve within 15 days. The site's Terms promise 48 hours / 30 days: **tighten to 24 hours / 15 days if counsel confirms Aalthara is an intermediary.** |
| Consumer Protection (E-Commerce) Rules, 2020 | Show the seller's legal name, address, contact and grievance officer; clear price including what tax applies; refund policy. Footer and Terms cover this once the placeholders are filled. |
| GST | 18% on the licence and yearly fee; GST invoice per payment. Registration and SAC code via the accountant. |
| TRAI commercial-communication (DLT) rules | SMS sender ID and templates for OTP and invites must be registered before any SMS is sent in India. |
| App Store and Google Play policies | In-app account deletion plus a web deletion URL; privacy label / data-safety form; privacy policy URL; no purchases outside the stores' rules (see ARCHITECTURE §7). |

Roles: for account and self-entered profile data Aalthara is the **Data Fiduciary**. For the directory an association compiles about its members, the **association is the Data Fiduciary and Aalthara its Data Processor**; the Terms (§2) carry the processing terms. Counsel should confirm this split and whether a separate data-processing agreement should be signed with each association.

## 2. Data inventory (also the answer sheet for store privacy forms)

| Data | Collected | Purpose | Shared with | Linked to identity | Used for tracking/ads |
|---|---|---|---|---|---|
| Phone number | yes | sign-in, invites | SMS/WhatsApp provider | yes | no |
| Name, gender, birth date, photo | yes | directory, tree | family members only | yes | no |
| Place, work, education, blood group | optional | directory, search | family members only | yes | no |
| Contact details | optional | directory | per user's visibility choice | yes | no |
| Relationships | yes | tree | family members only | yes | no |
| Device, app version, crash logs, push token | yes | reliability, notifications | Apple/Google push, crash tool | no (scrubbed) | no |
| Payment reference (admins) | yes | billing | Razorpay | yes | no |
| Caste, religion, government ID, precise location, contacts list, ad ID | **never** | | | | |

## 3. Promises made on the legal pages → what must be built

| Promise | Where it is enforced / what to build |
|---|---|
| Only family members can see a family | RLS in `0001_init.sql`; tests in `01_smoke.sql` |
| Contact visibility: family / admins / hidden | `person_contacts.visibility` + `contacts_select` policy; UI under Me |
| No accounts under 18; no contact details for children | `register_self`, `accept_invite`, `guard_minor_contact`; UI note on Add a relative |
| Parent/guardian consent for a child profile | Record a `consents` row (`child_profile`, `subject_person`) when a parent adds a child; when anyone else adds a child, mark `consent_status='pending'` and prompt a parent to confirm. **Counsel to confirm what "verifiable" requires here.** |
| Person added by a relative is told, and can remove themselves without an account | `POST /api/invite/send` sends the notice with a signed link to a web page that shows what is held and a Remove button → `data_requests` |
| Unconfirmed profiles are marked | `persons.consent_status`; show "Not yet confirmed by ‹name›" on the profile |
| Itemised notice before consent, in Malayalam and English | Consent screen in onboarding; versioned (`consents.notice_version`) |
| Withdraw consent / delete account in the app | Me › Privacy and my data → `/api/account/delete` → `erase_my_data()` |
| Erasure leaves an unnamed placeholder only if others are linked through you | `erase_my_data()`; tested |
| Download my data | `/api/export/me` |
| Nominate someone | `data_requests(kind='nomination')` + a simple form |
| Grievances answered ≤ 7 days, resolved ≤ 30 (law: ≤ 90) | `data_requests.due_at`; support inbox; weekly review |
| Inactive 3 years → notice 48h ahead → erase | `inactive-sweep` cron |
| Backups purged within 35 days of erasure | Supabase backup retention setting; confirm on the plan chosen |
| Data stored in India | Supabase project in `ap-south-1`; Vercel function region `bom1` |
| Breach: tell users and the Board; detailed report within 72 hours | Incident runbook (to write): detection, containment, user message template, Board report template, owner on call |
| Staff access is logged | Supabase audit logs; no shared dashboard accounts |
| Access rules tested before each release | CI runs `scripts/test-db.sh` |
| No ads, no tracking, no sale of data, no AI training on family data | No such SDKs; CI check on dependencies |
| Lapsed family is read-only, never held hostage; 30 days' notice before deletion after 12 months lapsed | `family_writable`; `billing-sweep` cron; export stays available |
| Refund within 14 days | Admin process via Razorpay dashboard; record in `payments` |

## 4. Still to decide with the owner and counsel

1. Legal entity details, Grievance Officer, support contacts, effective date, court jurisdiction (placeholders in `site/index.html`).
2. Trademark search and filing for "Aalthara" (classes 9 and 42), and the domain.
3. Whether to sign a short data-processing agreement with each association.
4. The verifiable-parental-consent method (the Rules describe using identity and age details already held, or a token from an authorised provider such as DigiLocker).
5. Blood group: optional and member-entered; counsel to confirm no extra handling is expected.
6. Final list of processors and their locations (the table at the end of the Privacy Policy).

## 5. Sources consulted (November 2026)

- AZB & Partners, "India's Digital Personal Data Protection Framework Comes into Effect": https://www.azbpartners.com/bank/update-indias-digital-personal-data-protection-framework-comes-into-effect/
- Khaitan & Co via Mondaq, "Digital Personal Data Protection Rules 2025: Highlights": https://www.mondaq.com/india/privacy-protection/1707558/digital-personal-data-protection-rules-2025-highlights
- EY India, "DPDP Act, 2023 and DPDP Rules, 2025": https://www.ey.com/en_in/insights/cybersecurity/transforming-data-privacy-digital-personal-data-protection-rules-2025
- SCC Online, "MeitY notified Digital Personal Data Protection Rules 2025": https://www.scconline.com/blog/post/2025/11/14/meity-notified-digital-personal-data-protection-rules-2025/
- AM Legals, "DPDP Rules notified: immediate actions": https://amlegals.com/dpdp-rules-notified-immediate-actions/
