-- Migration: Add habits and habit_logs tables with required enum types

-- Create enum types for habits
DO $$ BEGIN
  CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE habit_time_of_day AS ENUM ('morning', 'afternoon', 'evening', 'anytime');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Also ensure goal enums exist (they may not have been migrated either)
DO $$ BEGIN
  CREATE TYPE goal_metric AS ENUM ('hours', 'tasks', 'streak');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_period AS ENUM ('weekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_status AS ENUM ('active', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create goals table (also missing from database)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER NOT NULL DEFAULT 0,
  metric goal_metric NOT NULL,
  period goal_period NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status goal_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  frequency habit_frequency NOT NULL DEFAULT 'daily',
  target_days INTEGER[],
  target_count INTEGER DEFAULT 1,
  time_of_day habit_time_of_day DEFAULT 'anytime',
  reminder_time TEXT,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create habit_logs table
CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  date DATE NOT NULL,
  notes TEXT
);

-- Indexes for habits
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_archived ON habits(user_id, is_archived);

-- Indexes for habit_logs
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON habit_logs(user_id, date);
