# Moonbug Feature Log

Tracks implemented vs. planned capabilities per sprint milestone, as required by
`PROJECT_DOCUMENTATION.md` §7 (Development Tracking). Updated after every milestone.

## Legend
- ✅ Implemented (real, wired to PostgreSQL, no mocks)
- 🚧 Partial / in progress
- 📋 Planned (not yet started)

---

## Milestone 0 — Stabilize & Secure (committed: 932045d)
✅ Fixed release-blocking bug: GET /api/profile and GET /api/calendar were never
   registered on the router (defined-but-dead handlers). Home calendar + Profile now load.
✅ Added HTTP regression test (TestHttp_RoutesRegisteredRegression) guarding those routes.
✅ Restored git-ignored .env.example template.
📋 Secret hygiene: rotate leaked Gmail app password + JWT secret (deferred by user — disposable emails).

## Milestone 1 — Profile Portfolio (doc §2)
✅ Migration 002_portfolio.sql + db.go schema: profile_fields (nested tree),
   user_assets (car/bicycle/pets/jewelry/clothing), user_favorites, user_links.
✅ Backend store: nested field tree assembly, recursive upsert (tx-wrapped), assets with
   kind validation, favorites, links — all user-scoped, ON DELETE CASCADE.
✅ Backend handlers: GET /api/profile/portfolio, PUT /api/profile/portfolio (RequireAuth).
✅ Frontend: Profile.tsx rebuilt as Overview | Portfolio tabs; Portfolio has editable
   Fields (recursive), Assets (5 groups), Favorites (11 documented defaults seeded), Links
   (with Linktree toggle). Loads/saves via real API; visible error states.
✅ Verified: lint clean, go build OK, go test green, migration creates all 4 tables.

---

## Planned (roadmap, not yet started)
📋 Phase 2 — Events Catalogue Tier 2 + personal calendar (doc §3.C, §6)
📋 Phase 3 — Advertisers, Watchers & direct crypto payouts (doc §5, §1 addendum)
📋 Phase 4 — Live Chat + Challenge Audit Phase (doc §4)
📋 Phase 5 — Word-Guessing Game (doc §3.D)
📋 Phase 6 — Moon Dial depth + Support/FAQ/Contact/Terms/Payment/Donate (doc §3.B, §5, §7)
📋 Future: Moonbug Radio, expanded gaming suite (out of scope)

See .kilo/plans/1784471476639-moonbug-doc-alignment-plan.md for the full phased plan.

## Milestone 2 — Events Catalogue Tier 2 + Personal Calendar (doc §3.C, §6)
✅ Extended events table with tier (astronomical|community), author_id, approved.
✅ New user_calendar_events table (save events to personal calendar).
✅ Backend: POST /api/events (Tier 2 submit, pending approval), GET /api/events?tier=,
   GET/POST/DELETE /api/calendar/events/{id} (auth). Idempotent ALTER + backfill for dev DBs.
✅ Frontend: Events submit form + save-to-calendar toggle; Home "Upcoming astronomical events"
   card deep-linking to /events (doc §6).
✅ Fix: MoonDial SVG phase rendering (waxing/waning crescent vs gibbous, full/new boundaries).

## Milestone 2 — verified: lint clean, go build OK, go test green, migration runs.
