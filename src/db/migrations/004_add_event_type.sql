-- Migration: Add event_type enum and type column to events table

-- Create the event_type enum
DO $$ BEGIN
  CREATE TYPE event_type AS ENUM ('work', 'personal', 'meeting');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add the type column to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS type event_type NOT NULL DEFAULT 'work';
