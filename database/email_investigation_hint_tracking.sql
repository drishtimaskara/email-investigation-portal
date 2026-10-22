BEGIN;

-- 1. INVESTIGATION GROUPS
-- Each group can unlock at most 5 distinct hints.
-- Groups start inactive until 3 valid emails are registered.

CREATE TABLE investigation_groups (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT FALSE
);


-- 2. GROUP EMAILS
-- Exactly 3 valid emails are required to activate a group.
-- The required text must appear anywhere in each email.
-- Each email can belong to only one group.

CREATE TABLE group_emails (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id BIGINT NOT NULL
        REFERENCES investigation_groups(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    CONSTRAINT valid_hyderabad_email
        CHECK (
            email = LOWER(BTRIM(email))
            AND email LIKE '%hyderabad.bits-pilani%'
            AND email LIKE '%@%'
        )
);


-- 3. HINT CATALOGUE
-- Three hints per module.

CREATE TABLE hints (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    module VARCHAR(20) NOT NULL
        CHECK (module IN ('git', 'mirror', 'notes', 'osint')),
    hint_number SMALLINT NOT NULL
        CHECK (hint_number BETWEEN 1 AND 3),
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (module, hint_number)
);


-- 4. UNLOCKED HINTS
-- One row per group/hint combination.

CREATE TABLE group_hint_unlocks (
    group_id BIGINT NOT NULL
        REFERENCES investigation_groups(id),
    hint_id BIGINT NOT NULL
        REFERENCES hints(id),
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, hint_id)
);


-- 5. HINT ACCESS EVENTS
-- Every recorded access gets a separate row.
-- The composite foreign key requires the hint to be unlocked.

CREATE TABLE hint_access_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id BIGINT NOT NULL,
    hint_id BIGINT NOT NULL,
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (group_id, hint_id)
        REFERENCES group_hint_unlocks(group_id, hint_id)
);


-- 6. VALIDATE EMAIL COUNT BEFORE ACTIVATING A GROUP

CREATE OR REPLACE FUNCTION validate_group_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    email_count INTEGER;
BEGIN
    IF NEW.is_active THEN
        SELECT COUNT(*)
        INTO email_count
        FROM group_emails
        WHERE group_id = NEW.id;

        IF email_count <> 3 THEN
            RAISE EXCEPTION
                'A group must have exactly 3 email addresses to activate. Found: %',
                email_count;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER check_group_activation
BEFORE INSERT OR UPDATE OF is_active
ON investigation_groups
FOR EACH ROW
EXECUTE FUNCTION validate_group_activation();


-- 7. LIMIT EACH GROUP TO THREE EMAIL ADDRESSES

CREATE OR REPLACE FUNCTION enforce_three_group_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    email_count INTEGER;
    target_group BIGINT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        target_group := NEW.group_id;
    ELSE
        target_group := OLD.group_id;
    END IF;

    -- Serialize email-count changes for this group.
    PERFORM 1
    FROM investigation_groups
    WHERE id = target_group
    FOR UPDATE;

    IF TG_OP = 'INSERT' THEN
        SELECT COUNT(*)
        INTO email_count
        FROM group_emails
        WHERE group_id = NEW.group_id;

        IF email_count >= 3 THEN
            RAISE EXCEPTION
                'A group cannot register more than 3 email addresses.';
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        SELECT COUNT(*)
        INTO email_count
        FROM group_emails
        WHERE group_id = OLD.group_id;

        IF email_count <= 3
           AND EXISTS (
               SELECT 1
               FROM investigation_groups
               WHERE id = OLD.group_id
                 AND is_active = TRUE
           )
        THEN
            RAISE EXCEPTION
                'Deactivate the group before changing its registered emails.';
        END IF;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$;

CREATE TRIGGER limit_group_email_count
BEFORE INSERT OR DELETE
ON group_emails
FOR EACH ROW
EXECUTE FUNCTION enforce_three_group_emails();


-- 8. ENFORCE THE FIVE-DISTINCT-HINT LIMIT

CREATE OR REPLACE FUNCTION enforce_group_hint_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    hint_count INTEGER;
BEGIN
    -- Lock the group to avoid simultaneous unlocks bypassing the limit.
    PERFORM 1
    FROM investigation_groups
    WHERE id = NEW.group_id
      AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Group does not exist or is inactive.';
    END IF;

    -- Reject inactive hints.
    PERFORM 1
    FROM hints
    WHERE id = NEW.hint_id
      AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Hint does not exist or is inactive.';
    END IF;

    -- Re-unlocking an existing hint does not use another slot.
    IF EXISTS (
        SELECT 1
        FROM group_hint_unlocks
        WHERE group_id = NEW.group_id
          AND hint_id = NEW.hint_id
    ) THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*)
    INTO hint_count
    FROM group_hint_unlocks
    WHERE group_id = NEW.group_id;

    IF hint_count >= 5 THEN
        RAISE EXCEPTION
            'Hint limit reached: a group can unlock only 5 distinct hints.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER check_group_hint_limit
BEFORE INSERT
ON group_hint_unlocks
FOR EACH ROW
EXECUTE FUNCTION enforce_group_hint_limit();


-- 9. INDEXES

CREATE INDEX idx_hint_events_group_time
    ON hint_access_events (group_id, accessed_at DESC);

CREATE INDEX idx_hint_unlocks_hint
    ON group_hint_unlocks (hint_id);

CREATE INDEX idx_group_emails_group
    ON group_emails (group_id);


-- 10. SEED THE 12 HINTS

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
