-- Moonbug initial schema. The Go server applies this automatically on startup
-- (see backend/internal/db/db.go), but it is provided here as a portable,
-- reviewable migration you can run against any PostgreSQL instance.

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

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user ON user_calendar_events(user_id);

-- Seed the five lunar challenges (idempotent).
INSERT INTO challenges (slug, title, description, prompt, moon_phase, icon, sort_order)
VALUES
  ('new-moon-reflection', 'New Moon Reflection', 'Set your intentions for the cycle ahead while the sky is darkest.', 'Write three core intentions you want to manifest this lunar cycle.', 'New Moon', '🌑', 1),
  ('waxing-crescent-focus', 'Waxing Crescent Focus', 'Direct your rising energy with deliberate allocation.', 'Distribute your daily energy across mind, body, and spirit.', 'Waxing Crescent', '🌒', 2),
  ('full-moon-release', 'Full Moon Release', 'Let go of what no longer serves you under the fullest light.', 'List what you are ready to release, then watch it burn away.', 'Full Moon', '🌕', 3),
  ('waning-gratitude', 'Waning Gibbous Gratitude', 'Reflect on abundance as the light begins to wane.', 'Save three specific things or people you are grateful for today.', 'Waning Gibbous', '🌖', 4),
  ('balsamic-rest', 'Balsamic Moon Rest', 'Slow down and surrender before the cycle resets.', 'Complete a 4-7-8 breathing session to wind down.', 'Waning Crescent', '🌘', 5)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  prompt = EXCLUDED.prompt,
  moon_phase = EXCLUDED.moon_phase,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;
