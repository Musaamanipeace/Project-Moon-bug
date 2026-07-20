-- Moonbug Advertisers, Watchers & direct crypto payouts (doc §5 + §1 addendum).
-- Idempotent DDL for the ads + payout schema. Keep in sync with
-- backend/internal/db/db.go (schemaSQL const). Re-runnable on existing DBs.

CREATE TABLE IF NOT EXISTS advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('video','picture','paid_challenge','survey')),
  title TEXT NOT NULL,
  payload_url TEXT NOT NULL,
  reward_per_action NUMERIC(18,8) NOT NULL DEFAULT 0,
  reward_currency TEXT NOT NULL DEFAULT 'USDC',
  target_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  nsfw BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  min_payout NUMERIC(18,8) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS completion_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  nonce TEXT NOT NULL,
  signature TEXT NOT NULL,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, campaign_id, nonce)
);

CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chain TEXT NOT NULL CHECK (chain IN ('solana','evm')),
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, chain)
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_completion_tokens_user ON completion_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON user_wallets(user_id);

-- Curated embedded fallback advertiser + campaigns so the feed works before
-- any real advertiser registers. Fixed UUIDs keep re-runs idempotent.
INSERT INTO advertisers (id, name, verified)
VALUES ('11111111-1111-1111-1111-111111111111', 'Moonbug Curated', TRUE)
ON CONFLICT (id) DO UPDATE SET verified = TRUE;

INSERT INTO ad_campaigns
  (id, advertiser_id, format, title, payload_url, reward_per_action, reward_currency, target_categories, nsfw, status)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'picture', 'Cosmic Calm', 'https://cdn.moonbug.app/fallback/cosmic-calm.jpg', 0.05, 'USDC', '["influential","relaxed"]'::jsonb, FALSE, 'active'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'video', 'Lunar Glow', 'https://cdn.moonbug.app/fallback/lunar-glow.mp4', 0.10, 'USDC', '["humorous","creative"]'::jsonb, FALSE, 'active')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  payload_url = EXCLUDED.payload_url,
  reward_per_action = EXCLUDED.reward_per_action,
  target_categories = EXCLUDED.target_categories,
  status = EXCLUDED.status;
