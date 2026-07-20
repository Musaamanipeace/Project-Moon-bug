# Moonbug — Implementation Plan (align codebase to PROJECT_DOCUMENTATION.md)

## Context

The repository is a React 19 + Vite + TypeScript frontend with a Go (`net/http`) backend over
PostgreSQL. The README advertises a "production-grade" app, but the **authoritative spec is
`PROJECT_DOCUMENTATION.md`**, which describes a far larger product: profile portfolios, advertisers/
watchers with direct crypto payouts, live chat + peer audit, word-guessing game, full Events
Catalogue (Tier 1 astronomical + Tier 2 community), the offline Moon Dial, support/FAQ/contact,
terms, payment, donate tab, and more. The current code implements only a slice of this — and even
that slice has a release-blocking bug.

The goal is a **carefully engineered, real implementation** of the documented vision — not a demo,
not mock data, not shortcuts. Work in phases, each shipping verifiable value, with a feature-log
entry after every milestone (required by the doc's "Development Tracking" section).

## Current state (verified by reading the code)

**What works today**
- Auth: passwordless OTP (bcrypt + JWT http-only cookie, session table, revocation), password
  fallback, settings. Solid. (`backend/internal/auth`, `store`, `middleware`, `handlers`)
- 5 lunar challenges with real PostgreSQL persistence, badges, streak computation.
- Notebook (6 entry types: journal/dream/logbook/goal/schedule/idea) — full CRUD.
- Events catalogue (Tier 1 only) — seeded, read-only list endpoint.
- Lunar math shared between Go (`backend/internal/lunar`) and TS (`src/lib/lunar`) — consistent.
- Frontend pages: Home (MoonDial + calendar + 5 challenges), Challenges, ChallengeDetail, Profile,
  Notebook, Events, Login. TypeScript typecheck passes; Go builds.

**Release-blocking bug (must fix first)**
- `handlers.go` defines `calendarHandler` (line 367) and `profileHandler` (line 415) but they are
  **never registered** in `Router()`. Meanwhile `LunarCalendar.tsx` calls `GET /api/calendar?...` and
  `Profile.tsx` calls `GET /api/profile`. Both return 404 → Home calendar and Profile page are
  broken in any real run. (Dev "works" only because `.catch(()=>{})` swallows the error silently.)

**Documentation vs. implementation gap (the wider vision)**
The documented features with NO current implementation:
1. Profile Portfolio — dynamic nested fields, asset tracking (car/bike/pets/jewelry/clothing),
   favorites, linktree. (Current `users` table has only display_name/streak/settings.)
2. Advertisers & Watchers (Ads Feed) — video/picture/paid-challenge/survey formats, direct crypto
   payouts via stateless signed completion tokens, content guardrails + NSFW toggle, algorithmic
   matching, targeted surveys with no mid-survey screen-out. (Nothing exists.)
3. Live Chat + Challenge Audit Phase — peer review in chatrooms, points released on validation.
   (Nothing exists.)
4. Word-Guessing Game — 1,000 AI-generated levels, 4 hints @ 6s, 3 difficulty modes. (Nothing.)
5. Events Catalogue Tier 2 — community/advertiser-submitted events saved to personal calendar.
   (Only Tier 1 seeded; no submission, no personal calendar link.)
6. Moon Dial enhancements — sunrise/sunset/moonrise markers, horizon visibility, weather, phase
   scroller, "Did You Know?", historical calc (lunar cycles since birth + birth moon phase),
   offline-first ephemeris. (Currently only phase/illumination/days-to-next.)
7. Support / FAQ / Contact, Terms & Conditions, Payment System, Donate Tab, Landing pages.
   (None.)
8. Future additions: Moonbug Radio, expanded gaming suite. (Out of scope for now.)

**Non-functional / quality issues to address"
- `.env` is committed (contains real Gmail SMTP creds + JWT secret) though `.gitignore` ignores
  `.env*` — this is a security leak; rotate the secret and remove from history. (`git status`
  shows `.env` present, untracked-ish, plus `.env.example` was deleted.)
- `STRICT_PORT`/HMR and Go `:8080` vs Vite `:3000` dev wiring is fine; `scripts/dev.mjs` is solid.
- `SessionValid` is called on every request in middleware (extra DB round-trip) — acceptable, but
  note for later caching.
- No integration tests touch HTTP/routes; only unit tests for lunar/auth/store. The missing routes
  would have been caught by an HTTP smoke test.

## Guiding principles (from the user + the doc)
- No mocks, no placeholder data, no static-only UI. Real PostgreSQL, real endpoints, real auth.
- "Robust architectural base over rapid deployment." Prefer incremental, tested, reversible steps.
- Document unimplemented planned capabilities in a feature log after each sprint (doc §7).

## Phase 0 — Stabilize & secure (do this first, small, shippable)
1. **Fix the missing routes.** Register `calendarHandler` and `profileHandler` in `Router()`:
   - `GET /api/calendar` → `middleware.RequireAuth(calendarHandler())`
   - `GET /api/profile` → `middleware.RequireAuth(profileHandler())`
   Both handlers already exist and are correct; this is purely wiring. Verify Home calendar and
   Profile load end-to-end.
2. **Security hygiene.** Rotate `JWT_SECRET` and Gmail `SMTP_PASS`; restore a committed
   `.env.example` (template only) and ensure `.env` is never committed. Remove committed secrets.
3. **Add an HTTP smoke test** (`backend/test/http_test.go`) that boots the router against a test
   DB (or `httptest`) and asserts `/api/profile` and `/api/calendar` return 200 for an authed user.
   This prevents regressions of the exact bug just fixed.
4. Commit as "fix: register profile + calendar routes; secure env".

## Phase 1 — Profile Portfolio (doc §2)
Expand the identity model to match the documented dynamic portfolio.
1. New migration `migrations/002_portfolio.sql` (+ add to `db.go` schemaSQL):
   - `profile_fields` (user_id, title, value_text, value_int, value_json, sort_order, parent_id
     for nested sub-fields) — supports title/value, integers, multi-value, and nested key-value.
   - `user_assets` (user_id, kind ['car','bicycle','pets','jewelry','clothing'], title, detail jsonb).
   - `user_favorites` (user_id, kind, label, value) with the documented default set + auto-added
     hobby suggestions.
   - `user_links` (user_id, url) OR a single `linktree_url` column on users.
2. Backend: `store` + `handlers` for `GET/PUT /api/profile/portfolio` (nested read/write), assets,
   favorites, links. Keep existing `/api/profile` and extend it to include portfolio summary.
3. Frontend: rebuild `Profile.tsx` into tabbed sections (Identity, Portfolio fields, Assets,
   Favorites, Links) reusing the existing glass/design system. Render nested fields in strict
   logical order.
4. Feature-log entry. Commit per section.

## Phase 2 — Events Catalogue Tier 2 + personal calendar (doc §3.C, §6)
1. Migration `003_events_tier2.sql`: add `tier` ('astronomical'|'community'), `author_id`
   (nullable → users), `approved` bool, `personal_event` flag; a `user_calendar_events`
   (user_id, event_id, reminder) table for "save to personal calendar."
2. Backend: `POST /api/events` (users/verified advertisers submit; pending approval),
   `GET /api/events?tier=...&from=...` (include approved community), `POST/DELETE
   /api/calendar/events/{id}` to save/unsave to personal calendar. Approval queue endpoint for
   moderators (stub as admin-by-flag for now).
3. Frontend: Events page gets a "Submit event" form + "Save to my calendar" toggle; Home dashboard
   "upcoming astronomical events card" deep-links (doc §6) — wire the existing card to `/events`.
4. Feature-log entry. Commit.

## Phase 3 — Advertisers, Watchers & direct crypto payouts (doc §5, §1 addendum)
This is the largest pillar. Build the **stateless, non-custodial** architecture from the doc.
1. Migration `004_ads.sql`: `advertisers` (id, name, verified), `ad_campaigns` (advertiser_id,
   format ['video','picture','paid_challenge','survey'], title, payload_url, reward_per_action,
   target_categories jsonb, nsfw bool, status), `surveys` (campaign_id, questions jsonb),
   `completion_tokens` (id, user_id, campaign_id, signature, claimed bool, created_at),
   `user_wallets` (user_id, chain ['solana','btc_ln','evm'], address) — public key only.
2. Backend crypto: `internal/payout` — Moonbug Ed25519/Schnorr private key; sign one-time
   completion token `{user_id, campaign_id, nonce, ts}`; expose `GET /api/public-key` (verify
   endpoint for advertisers). Endpoints: advertiser campaign CRUD, `GET /api/ads/feed` (curated
   embedded fallback first, then algorithmic match by watcher prefs), `POST /api/ads/{id}/complete`
   → validates interaction, mints + returns signed token (advertiser pays on-chain, out of Moonbug
   flow). Wallet `GET/PUT /api/profile/wallet`. NSFW gated behind explicit `GET /api/ads?nsfw=1`
   with user toggle in settings. Survey endpoint enforces no mid-survey screen-out.
3. Frontend: Ads feed container on Home (doc §6), Watcher preference curation, NSFW toggle in
   settings, survey flow UI, wallet setup in Profile. Phased: ship embedded fallback ads first
   (no external advertiser needed), then live campaign matching.
4. Feature-log entry. Commit in sub-steps.

## Phase 4 — Live Chat + Challenge Audit Phase (doc §4)
1. Migration `005_chat.sql`: `chat_rooms` (challenge_id/audit), `messages` (room_id, user_id, body,
   created_at), `audit_assignments` (challenge_log_id, auditor_id, status, decided_at).
2. Backend: chat REST (or WebSocket later) `GET/POST /api/chat/rooms/{id}/messages`,
   audit assignment + `POST /api/challenges/{slug}/audit/{logId}/decision` (release points).
   Long challenges get an audit phase after submission.
3. Frontend: collaborative chatrooms for group challenges; audit review view for assigned peers.
4. Feature-log entry. Commit.

## Phase 5 — Word-Guessing Game (doc §3.D)
1. Migration `006_game.sql`: `game_levels` (difficulty, answer, hints jsonb[4], extra_hints int),
   `game_progress` (user_id, level_id, score, completed). Seed 1,000 AI-generated levels across
   Easy/Medium/Hard (generate via script, not hand-written; store as data).
2. Backend: `GET /api/game/level`, `POST /api/game/answer` (award points, early-answer bonus),
   difficulty routes.
3. Frontend: 4-hint @6s-flash UI, point bonus, difficulty selector.
4. Feature-log entry. Commit.

## Phase 6 — Moon Dial depth + remaining surfaces (doc §3.B, §5, §7)
1. Moon Dial: markers (sunrise/sunset/moonrise/moonset/midday/midnight/mid-moonlight), horizon
   visibility, phase scroller, "Did You Know?" daily synopsis, historical calculator (cycles since
   birth + birth moon phase). Offline-first: embed compressed ephemeris coefficients in a local
   store (SQLite/local JSON) per the doc's Universal Data Point section. Extend shared
   `lunar` module (Go + TS) carefully keeping them in sync (add a cross-language test vector).
2. Static-but-real surfaces: Support/FAQ/Contact (with a real contact submission endpoint +
   mailbox), Terms & Conditions, Payment System page, Donate Tab, signed-in/unsigned landing
   pages per doc §6.
3. Feature-log entry. Commit.

## Out of scope (explicitly deferred)
- Moonbug Radio, expanded gaming suite (doc future additions).
- Real on-chain smart-contract integration (we implement the stateless signing + token hand-off;
  actual advertiser payout broadcast is the advertiser's system).

## Validation strategy (per phase)
- `npm run lint` (tsc --noEmit) must pass; `go build ./...` and `go test ./...` must pass.
- Add/extend HTTP smoke tests in `backend/test` covering each new route with an authed test user
  and a real (test) PostgreSQL. Use `docker compose up -d` for the DB locally.
- Manual end-to-end: `npm run dev`, exercise each flow in the browser; confirm no silent
  `.catch(()=>{})` masking failures (add visible error states where currently swallowed).
- For payouts/chat/game, add unit tests for crypto signing, streak, and scoring logic.

## Open questions for the user (resolve before/at Phase 3)
1. Crypto payout: confirm supported chains for v1 (doc lists Solana / BTC Lightning / EVM). Recommend
   **Solana + EVM** first, BTC-LN as follow-up.
2. Advertiser onboarding: full self-serve advertiser accounts now, or start with embedded curated
   fallback + a manual advertiser table? Recommend **embedded fallback first** (doc phased approach).
3. Live chat transport: REST polling (simpler, matches current stack) vs WebSocket? Recommend
   **REST polling for v1**, WebSocket later.
4. Chat LLM capability: `metadata.json` notes `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` — is the
   AI Events-pipeline / hints generation meant to call Gemini server-side? Confirm before Phase 2/5
   seeding scripts.

## Commit discipline
- Stage and commit after each phase (and ideally each sub-step), with descriptive messages.
- Maintain `FEATURE_LOG.md` (new file) listing implemented vs planned capabilities after every
  milestone, per doc §7.
