-- ============================================================
-- EMAIL INVESTIGATION PORTAL - MASTER DATABASE SCHEMA
-- File: database/email_investigation_hint_tracking.sql
-- ============================================================

-- Clean teardown order respecting foreign keys
DROP TABLE IF EXISTS team_hint_unlocks CASCADE;
DROP TABLE IF EXISTS hints CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS email_starred CASCADE;
DROP TABLE IF EXISTS email_reads CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS emails CASCADE;

-- 1. ORIGINAL APPLICATION TABLES
CREATE TABLE emails (
  id SERIAL PRIMARY KEY,
  mail_no INT UNIQUE NOT NULL,
  folder TEXT NOT NULL,
  sender TEXT,
  recipient TEXT,
  sent_at TIMESTAMPTZ,
  subject TEXT,
  body TEXT NOT NULL,
  is_unread BOOLEAN DEFAULT FALSE,
  attachment TEXT
);

CREATE TABLE attachments (
  id SERIAL PRIMARY KEY,
  email_id INT REFERENCES emails(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL
);

CREATE TABLE email_reads (
  id SERIAL PRIMARY KEY,
  email_id INT REFERENCES emails(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  read_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_starred (
  id SERIAL PRIMARY KEY,
  email_id INT REFERENCES emails(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  starred_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. TEAM & SECURE HINT TRACKING TABLES
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  team_name TEXT UNIQUE NOT NULL,
  total_hints_used INT DEFAULT 0
);

CREATE TABLE hints (
  id SERIAL PRIMARY KEY,
  module TEXT NOT NULL,       -- Git, MIRROR, Notes, OSINT
  hint_number INT NOT NULL,  -- 1, 2, 3
  content TEXT NOT NULL,
  CONSTRAINT unique_module_hint UNIQUE (module, hint_number)
);

CREATE TABLE team_hint_unlocks (
  id SERIAL PRIMARY KEY,
  team_id INT REFERENCES teams(id) ON DELETE CASCADE,
  hint_id INT REFERENCES hints(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_team_hint UNIQUE (team_id, hint_id)
);

-- 3. INITIAL SEED DATA
INSERT INTO teams (id, team_name) VALUES (1, 'Default Team') ON CONFLICT DO NOTHING;

INSERT INTO hints (module, hint_number, content) VALUES
  ('Git', 1, 'The current branch is not the whole story.'),
  ('Git', 2, 'Look at commit metadata and removed files.'),
  ('Git', 3, 'Compare author and committer dates; recover validation_summary.md.'),
  
  ('MIRROR', 1, 'Anonymous does not always mean unidentifiable.'),
  ('MIRROR', 2, 'Compare retained attributes with the separate roster.'),
  ('MIRROR', 3, 'Match MIR-1042 and inspect the sync/export diagnostics.'),
  
  ('Notes', 1, 'The activity log knows more than the notes list.'),
  ('Notes', 2, 'Check the unknown device and Settings.'),
  ('Notes', 3, 'The version number opens the private note.'),
  
  ('OSINT', 1, 'A username is not a person.'),
  ('OSINT', 2, 'Compare the directory with older announcements'),
  ('OSINT', 3, 'Find the historical purpose of orion-review-17.')
ON CONFLICT (module, hint_number) DO NOTHING;