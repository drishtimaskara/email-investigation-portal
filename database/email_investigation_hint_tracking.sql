-- Email Investigation Portal
-- PostgreSQL schema and hint-tracking setup
-- Scope: database tables, hint seed data, indexes, and optional test queries.
-- Note: this script does NOT implement the application/backend five-hint enforcement.

BEGIN;

-- 1. Investigation groups
CREATE TABLE IF NOT EXISTS investigation_groups (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    bits_email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Hint catalogue: 3 hints for each of the 4 modules
CREATE TABLE IF NOT EXISTS hints (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    module VARCHAR(20) NOT NULL
        CHECK (module IN ('git', 'mirror', 'notes', 'osint')),
    hint_number SMALLINT NOT NULL
        CHECK (hint_number BETWEEN 1 AND 3),
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (module, hint_number)
);

-- 3. First unlock per group/hint combination
CREATE TABLE IF NOT EXISTS group_hint_unlocks (
    group_id BIGINT NOT NULL
        REFERENCES investigation_groups(id),
    hint_id BIGINT NOT NULL
        REFERENCES hints(id),
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, hint_id)
);

-- 4. One row per access event, including repeated accesses
CREATE TABLE IF NOT EXISTS hint_access_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id BIGINT NOT NULL,
    hint_id BIGINT NOT NULL,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    FOREIGN KEY (group_id, hint_id)
        REFERENCES group_hint_unlocks(group_id, hint_id)
);

-- Indexes to help common lookups
CREATE INDEX IF NOT EXISTS idx_hint_events_group_time
    ON hint_access_events (group_id, accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_hint_unlocks_hint
    ON group_hint_unlocks (hint_id);

-- 5. Seed the 12 hints.
-- ON CONFLICT makes this safe to rerun without duplicating module/hint pairs.
INSERT INTO hints (module, hint_number, content)
VALUES
    ('git', 1, 'The current branch is not the whole story.'),
    ('git', 2, 'Look at commit metadata and removed files.'),
    ('git', 3, 'Compare author and committer dates; recover validation_summary.md.'),

    ('mirror', 1, 'Anonymous does not always mean unidentifiable.'),
    ('mirror', 2, 'Compare retained attributes with the separate roster.'),
    ('mirror', 3, 'Match MIR-1042 and inspect the sync/export diagnostics.'),

    ('notes', 1, 'The activity log knows more than the notes list.'),
    ('notes', 2, 'Check the unknown device and Settings.'),
    ('notes', 3, 'The version number opens the private note.'),

    ('osint', 1, 'A username is not a person.'),
    ('osint', 2, 'Compare the directory with older announcements.'),
    ('osint', 3, 'Find the historical purpose of orion-review-17.')
ON CONFLICT (module, hint_number) DO NOTHING;

COMMIT;


-- ==========================================================
-- VERIFICATION QUERIES (run separately as needed)
-- ==========================================================

-- A. List the tables in the public schema:
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- B. Verify the 12 hints:
-- SELECT module, hint_number, content, is_active
-- FROM hints
-- ORDER BY module, hint_number;

-- C. Count groups, distinct unlock records, and access events:
-- SELECT
--   (SELECT COUNT(*) FROM investigation_groups) AS total_groups,
--   (SELECT COUNT(*) FROM group_hint_unlocks) AS total_unlocks,
--   (SELECT COUNT(*) FROM hint_access_events) AS total_access_events;

-- D. OPTIONAL TEST DATA: insert a test group (safe to rerun by email).
-- INSERT INTO investigation_groups (group_name, bits_email)
-- VALUES ('test grp', 'test@gmail.com')
-- ON CONFLICT (bits_email) DO NOTHING;

-- E. Find the test group's ID and Git Hint 1's ID:
-- SELECT g.id AS group_id, g.group_name, h.id AS hint_id, h.content
-- FROM investigation_groups g
-- CROSS JOIN hints h
-- WHERE g.group_name = 'test grp'
--   AND g.bits_email = 'test@gmail.com'
--   AND h.module = 'git'
--   AND h.hint_number = 1;

-- F. OPTIONAL TEST: record the unlock for Git Hint 1.
-- INSERT INTO group_hint_unlocks (group_id, hint_id)
-- SELECT g.id, h.id
-- FROM investigation_groups g
-- CROSS JOIN hints h
-- WHERE g.group_name = 'test grp'
--   AND g.bits_email = 'test@gmail.com'
--   AND h.module = 'git'
--   AND h.hint_number = 1
-- ON CONFLICT (group_id, hint_id) DO NOTHING;

-- G. OPTIONAL TEST: record an access event for an already-unlocked hint.
-- Run this once each time you want to simulate an access.
-- INSERT INTO hint_access_events (group_id, hint_id)
-- SELECT u.group_id, u.hint_id
-- FROM group_hint_unlocks u
-- JOIN investigation_groups g ON g.id = u.group_id
-- JOIN hints h ON h.id = u.hint_id
-- WHERE g.group_name = 'test grp'
--   AND g.bits_email = 'test@gmail.com'
--   AND h.module = 'git'
--   AND h.hint_number = 1;

-- H. View the full access log with group/module/hint details:
-- SELECT
--   e.id AS event_id,
--   g.group_name,
--   h.module,
--   h.hint_number,
--   e.accessed_at
-- FROM hint_access_events e
-- JOIN investigation_groups g ON e.group_id = g.id
-- JOIN hints h ON e.hint_id = h.id
-- ORDER BY e.accessed_at DESC;

-- IMPORTANT DESIGN NOTES:
-- 1. group_hint_unlocks stores each group/hint pair once.
-- 2. hint_access_events stores every access; repeated accesses get new IDs/timestamps.
-- 3. Five-hint limit must be enforced by backend logic or a carefully designed database
--    mechanism. The schema alone does not enforce that limit.
-- 4. This is the hint-tracking subsystem, not the complete portal schema. Email/evidence
--    metadata and user/authentication tables may still be required by the full project.
