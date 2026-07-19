package db

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Pool is the shared PostgreSQL connection pool.
var Pool *pgxpool.Pool

// Connect establishes the connection pool using DATABASE_URL.
func Connect() error {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		return fmt.Errorf("DATABASE_URL environment variable is not set")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("unable to ping database: %w", err)
	}
	Pool = pool
	return nil
}

// Close releases the connection pool.
func Close() {
	if Pool != nil {
		Pool.Close()
	}
}

const schemaSQL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT NOT NULL DEFAULT 'Moonbug',
  auth_method TEXT NOT NULL DEFAULT 'otp',
  preferred_method TEXT NOT NULL DEFAULT 'otp',
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prompt TEXT NOT NULL,
  moon_phase TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS challenge_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, log_date)
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS notebook_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('journal','dream','logbook','goal','schedule','idea')),
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  synopsis TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'astronomical',
  source TEXT NOT NULL DEFAULT '',
  tier TEXT NOT NULL DEFAULT 'astronomical' CHECK (tier IN ('astronomical','community')),
  author_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reminder BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS profile_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID NULL REFERENCES profile_fields(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  value_text TEXT,
  value_int INTEGER,
  value_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text','integer','multi','nested')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('car','bicycle','pets','jewelry','clothing')),
  title TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  is_linktree BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_user_date ON challenge_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email, expires_at);
CREATE INDEX IF NOT EXISTS idx_notebook_user ON notebook_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user ON user_calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_fields_user ON profile_fields(user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_user_assets_user ON user_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_links_user ON user_links(user_id);
`

type seedChallenge struct {
	slug        string
	title       string
	description string
	prompt      string
	moonPhase   string
	icon        string
	sortOrder   int
}

var seedChallenges = []seedChallenge{
	{"new-moon-reflection", "New Moon Reflection", "Set your intentions for the cycle ahead while the sky is darkest.", "Write three core intentions you want to manifest this lunar cycle.", "New Moon", "🌑", 1},
	{"waxing-crescent-focus", "Waxing Crescent Focus", "Direct your rising energy with deliberate allocation.", "Distribute your daily energy across mind, body, and spirit.", "Waxing Crescent", "🌒", 2},
	{"full-moon-release", "Full Moon Release", "Let go of what no longer serves you under the fullest light.", "List what you are ready to release, then watch it burn away.", "Full Moon", "🌕", 3},
	{"waning-gratitude", "Waning Gibbous Gratitude", "Reflect on abundance as the light begins to wane.", "Save three specific things or people you are grateful for today.", "Waning Gibbous", "🌖", 4},
	{"balsamic-rest", "Balsamic Moon Rest", "Slow down and surrender before the cycle resets.", "Complete a 4-7-8 breathing session to wind down.", "Waning Crescent", "🌘", 5},
}

// RunMigrations creates the schema and seeds the challenge catalogue.
func RunMigrations() error {
	ctx := context.Background()
	if _, err := Pool.Exec(ctx, schemaSQL); err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	// Idempotent extension of the events table for Tier 2 + personal calendar.
	// Safe to re-run on existing dev databases.
	if _, err := Pool.Exec(ctx, `
		ALTER TABLE events ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'astronomical' CHECK (tier IN ('astronomical','community'));
		ALTER TABLE events ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id) ON DELETE SET NULL;
		ALTER TABLE events ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;
	`); err != nil {
		return fmt.Errorf("events extension failed: %w", err)
	}
	if _, err := Pool.Exec(ctx, `
		UPDATE events SET tier = 'astronomical' WHERE tier IS NULL;
		UPDATE events SET approved = TRUE WHERE tier = 'astronomical' AND approved = FALSE;
	`); err != nil {
		return fmt.Errorf("events backfill failed: %w", err)
	}

	for _, c := range seedChallenges {
		_, err := Pool.Exec(ctx, `
			INSERT INTO challenges (slug, title, description, prompt, moon_phase, icon, sort_order)
			VALUES ($1,$2,$3,$4,$5,$6,$7)
			ON CONFLICT (slug) DO UPDATE SET
				title = EXCLUDED.title,
				description = EXCLUDED.description,
				prompt = EXCLUDED.prompt,
				moon_phase = EXCLUDED.moon_phase,
				icon = EXCLUDED.icon,
				sort_order = EXCLUDED.sort_order
		`, c.slug, c.title, c.description, c.prompt, c.moonPhase, c.icon, c.sortOrder)
		if err != nil {
			return fmt.Errorf("seeding challenge %s failed: %w", c.slug, err)
		}
		// Tier 1 astronomical events (public, well-documented, offline catalogue).
		// Dates are illustrative annual markers; replace with a curated dataset as needed.
		_, err = Pool.Exec(ctx, `
			INSERT INTO events (title, event_date, rarity, synopsis, category, source, tier, approved)
			VALUES
				('Perseid Meteor Shower Peak', '2026-08-12', 'annual', 'Up to 100 meteors per hour as Earth passes through debris from comet 109P/Swift-Tuttle.', 'astronomical', 'NASA', 'astronomical', TRUE),
				('Autumn Equinox', '2026-09-22', 'annual', 'The Sun crosses the celestial equator; day and night are nearly equal in length.', 'astronomical', 'IAU', 'astronomical', TRUE),
				('Orionid Meteor Shower Peak', '2026-10-21', 'annual', 'Meteors radiate from Orion, left behind by Halley''s Comet.', 'astronomical', 'NASA', 'astronomical', TRUE),
				('Winter Solstice', '2026-12-21', 'annual', 'The longest night of the year in the Northern Hemisphere.', 'astronomical', 'IAU', 'astronomical', TRUE),
				('Geminid Meteor Shower Peak', '2026-12-14', 'annual', 'One of the richest showers, up to 120 multicolored meteors per hour.', 'astronomical', 'NASA', 'astronomical', TRUE),
				('Total Lunar Eclipse', '2026-03-03', 'rare', 'The Full Moon passes fully into Earth''s umbra, glowing copper-red.', 'astronomical', 'NASA', 'astronomical', TRUE)
			ON CONFLICT DO NOTHING
		`)
		if err != nil {
			return fmt.Errorf("seeding events failed: %w", err)
		}
	}
	return nil
}
