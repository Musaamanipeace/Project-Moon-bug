-- Moonbug Events Tier 2 + personal calendar.
-- Extends the events table (tier / author_id / approved) and adds the
-- user_calendar_events join table. Keep in sync with backend/internal/db/db.go.

ALTER TABLE events ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'astronomical' CHECK (tier IN ('astronomical','community'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE events SET tier = 'astronomical' WHERE tier IS NULL;
UPDATE events SET approved = TRUE WHERE tier = 'astronomical' AND approved = FALSE;

CREATE TABLE IF NOT EXISTS user_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reminder BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_user_calendar_events_user ON user_calendar_events(user_id);
