# Aalthara — product requirements

## 1. What it is, and for whom

A private family tree and directory for Kerala family associations.

| Person | What they need |
|---|---|
| **Saraswathi Amma, 72** — member, Malayalam-first, hand-me-down Android | Find a relative's number and call. See whose birthday it is. Know when the meet is. Never get lost. |
| **Anand, 55** — association secretary, the buyer and admin | Get 200+ people registered without doing it all himself. Keep it accurate. Print the directory. Pay once. |
| **Meera, 29** — in Dubai, iPhone, in three families (father's, mother's, husband's) | One account. Add her household in two minutes. Find cousins near her. |

Comparable products and what Aalthara does differently: the existing Kerala kudumbayogam directory apps are built one per family and are member lists with events and a blood-bank page rather than trees; the genealogy apps (FamilySearch, MyHeritage, Ancestry) are built for historical research and DNA matching; general family-tree makers (Kintree and similar) are built for one household's tree, not an association's register. Aalthara is a paid, ad-free, elder-first tree and directory that many families share, with one identity per person.

## 2. Roles

| Role | Can |
|---|---|
| Owner | Everything an admin can; pay; transfer ownership; delete the family |
| Admin | Approve join requests, set roles (not owner), edit any unclaimed profile, merge duplicates, manage branches, export/print |
| Editor | Add and edit unclaimed profiles, events and notices |
| Member | See the family; edit own profile; add own relatives; invite relatives; RSVP |

A claimed profile (its owner has signed in) can be edited only by that person.

## 3. Features (v1)

### 3.1 Sign in and register
- Mobile number + 6-digit code by SMS (WhatsApp as fallback). No passwords, no email required. Code auto-fills on both platforms.
- Language choice (Malayalam / English) on the first screen.
- New user: name, year of birth (full date optional), then one of: **I have an invite link** (opens straight into the family, claiming the profile a relative made), **I have a family code** (request to join, admin approves), **Start a new family**.
- Accounts are 18+. `register_self` enforces it.
- Acceptance: a first-time user with an invite link reaches their family's Home in ≤ 4 screens and ≤ 90 seconds.

### 3.2 Home
Per family: today's birthdays and remembrance days, next event with RSVP, "Who is where" place chips, pending requests (admins), Add a relative. Family switcher when the user is in more than one family.

### 3.3 Tree — "walk the tree"
- One focus person with parents above, partner beside, children below, siblings in a row underneath. Tap anyone to make them the focus. No free-form canvas on phones.
- "Add" slots where a parent, partner, child or sibling is missing.
- Breadcrumb back to "You". Generation arrows ("Go up to grandparents").
- Tablet/web (≥ 840px): the same view on the left plus a three-generation chart on the right, pannable, never required.
- Handles: any number of partners over time (current, widowed, divorced), biological/adoptive/step/foster parents, half-siblings, unknown parents (placeholder), people who have died, marriages between two families already on Aalthara.

### 3.4 Add a relative
- "Who is this to ‹name›?" tiles: Mother, Father, Husband or wife, Son or daughter, Brother, Sister. Then name, born (day/month/year or "I only know the year"), living or passed away. Optional afterwards: phone, place, work, photo.
- One RPC call (`add_relative`); optimistic UI; works offline (queued).
- Adding a child of a couple links both parents. Adding a sibling shares the anchor's parents.
- Under 18: only name, gender, birthday; explanatory note shown (see design).
- After saving: "Invite ‹name›" (WhatsApp share sheet with invite link) and "Add another".

### 3.5 Find — search by facts
- One search field over name (English or Malayalam), nickname, house name, place, native place, occupation, employer, education. Typo-tolerant.
- Fact chips with counts: places (city, country), blood group, professions, branches, "birthdays this month", "new this month".
- Results are PersonRows with a Call button. Result count is always stated ("14 people in Dubai").
- Runs on the device against the local cache; server `search_people` is the fallback on web and for families not yet synced.

### 3.6 Person
Disc, name (English + Malayalam), relation to you in the family's words, Call / WhatsApp, facts (lives in, work, blood group, birthday, branch), close family, "How you are related" path, "See in the tree". Own profile: edit, and per-field contact visibility (family / admins only / hidden).

### 3.7 How are we related?
Pick any two people; show the chain and the kinship term in Malayalam and English (`packages/core/kinship.ts`). Admins can override terms per family (communities differ).

### 3.8 Many families, one person
- "My families" under Me; switcher on Home/Tree/Find.
- Joining a second family through an invite that points at an unclaimed duplicate merges it into the user's existing profile (`accept_invite`). Admins can merge duplicates (`merge_duplicate`) and are prompted when a new profile matches an existing one by phone, or by name + birth year.
- Families are mutually private: sharing a member does not expose one family to the other.

### 3.9 Events and notices
Annual meet, weddings, housewarmings, memorials, notices. RSVP with headcount. Push + in-app. Admin sees a headcount.

### 3.10 Admin
Join requests; roles; branches (name + one of six colours); duplicates; **Print directory** (PDF booklet, A5 imposed on A4, by branch then household) and spreadsheet export; billing status and pay link (opens the website; no in-app purchase); member-additions setting (open / needs approval).

### 3.11 Me
Edit my details, my families, text size (three steps, on top of the system setting), language, who can see my number, help (call / WhatsApp support), privacy and my data (download my data, withdraw consent, nominate someone, delete my account).

## 4. Pricing and licence behaviour

| Plan | One-time | Yearly from year 2 | Members |
|---|---|---|---|
| Trial | free, 30 days | — | 50 |
| Kudumbam | ₹7,500 | ₹1,200 | 300 |
| Tharavadu | ₹15,000 | ₹2,400 | 1,500 |
| Custom | by quote | by quote | above 1,500 |

*Proposed figures; the owner sets the final prices.* GST extra. Paid on the website via Razorpay. Lapsed (after 30-day grace) = read-only, never deleted without notice. Member limit and read-only state are enforced in the database (`family_billing`, `guard_family_members`, `family_writable`).

## 5. Out of scope for v1
Chat or a social feed; DNA; public/historical record search; in-app purchases; photo albums; donations and dues collection; horoscope/star data; GEDCOM import (planned v1.1 with spreadsheet import).

## 6. Screens

Designed (see the design canvas): Welcome, Home, Tree, Find, Person (iOS); Home, Tree, Add a relative, Find, Me (Android). Each exists on both platforms using the platform manners in `docs/DESIGN.md`.

Still to design from the system, following the same patterns: code entry, your-name step, join-or-start, family code entry, start a family, invite share, edit my details, contact visibility, how-are-we-related picker and result, events list, event, admin home, join requests, duplicates, branches, print directory, billing, privacy and my data, delete account, empty/offline/error states, tablet two-pane layouts.

## 7. Success measures
- 70% of a family's living adults registered within 30 days of the family's first payment.
- A member aged 65+ completes "find a relative and call" unaided in a moderated test (target 9 of 10).
- Crash-free sessions ≥ 99.5%. Median search time on device < 100ms.
