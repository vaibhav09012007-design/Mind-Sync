-- Migration: Add rate_limits table for distributed rate limiting
-- This table stores rate limit data that works across serverless instances

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast key lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- Index for cleanup job to find expired entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);

-- Comment explaining the table purpose
COMMENT ON TABLE rate_limits IS 'Distributed rate limiting for AI endpoints - works across serverless instances';
