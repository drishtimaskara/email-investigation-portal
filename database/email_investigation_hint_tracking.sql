
BEGIN;


CREATE TABLE investigation_groups (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE group_emails (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    group_id BIGINT NOT NULL
        REFERENCES investigation_groups(id)
        ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL UNIQUE,

    CONSTRAINT valid_hyderabad_email CHECK (
        email = LOWER(BTRIM(email))
        AND email LIKE '%hyderabad.bits-pilani%'
        AND email LIKE '%@%'
    ),

    UNIQUE (group_id, email)
);

CREATE TABLE team_mailboxes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    group_id BIGINT NOT NULL UNIQUE
        REFERENCES investigation_groups(id)
        ON DELETE CASCADE,

    mailbox_address VARCHAR(255) NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (group_id, id)
);

CREATE OR REPLACE FUNCTION create_team_mailbox()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO team_mailboxes (
        group_id,
        mailbox_address
    )
    VALUES (
        NEW.id,
        'team-' || NEW.id || '@hyderabad.bits-pilani.example'
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER auto_create_team_mailbox
AFTER INSERT ON investigation_groups
FOR EACH ROW
EXECUTE FUNCTION create_team_mailbox();

CREATE TABLE team_users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    group_id BIGINT NOT NULL,

    email VARCHAR(255) NOT NULL,

    username VARCHAR(100) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL
        CHECK (LENGTH(password_hash) > 0),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (email),
    UNIQUE (group_id, id),

    FOREIGN KEY (group_id, email)
        REFERENCES group_emails(group_id, email)
        ON DELETE CASCADE
);

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

CREATE TABLE group_hint_unlocks (
    group_id BIGINT NOT NULL
        REFERENCES investigation_groups(id)
        ON DELETE CASCADE,

    hint_id BIGINT NOT NULL
        REFERENCES hints(id),

    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (group_id, hint_id)
);

CREATE TABLE hint_access_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    hint_id BIGINT NOT NULL,

    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (group_id, hint_id)
        REFERENCES group_hint_unlocks(group_id, hint_id)
        ON DELETE CASCADE,

    FOREIGN KEY (group_id, user_id)
        REFERENCES team_users(group_id, id)
        ON DELETE CASCADE
);

CREATE TABLE mailbox_messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    group_id BIGINT NOT NULL,
    mailbox_id BIGINT NOT NULL,

    folder VARCHAR(20) NOT NULL DEFAULT 'inbox'
        CHECK (folder IN ('inbox', 'sent', 'drafts', 'trash')),

    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,

    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (group_id, mailbox_id)
        REFERENCES team_mailboxes(group_id, id)
        ON DELETE CASCADE,

    UNIQUE (group_id, id)
);

CREATE TABLE mailbox_attachments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    message_id BIGINT NOT NULL
        REFERENCES mailbox_messages(id)
        ON DELETE CASCADE,

    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(150),
    storage_key TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mailbox_message_reads (
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    message_id BIGINT NOT NULL,

    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, message_id),

    FOREIGN KEY (group_id, user_id)
        REFERENCES team_users(group_id, id)
        ON DELETE CASCADE,

    FOREIGN KEY (group_id, message_id)
        REFERENCES mailbox_messages(group_id, id)
        ON DELETE CASCADE
);

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

CREATE OR REPLACE FUNCTION enforce_three_group_emails()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    email_count INTEGER;
    target_group BIGINT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION
            'Email records cannot be updated. Deactivate the group and replace the email explicitly.';
    END IF;

    IF TG_OP = 'INSERT' THEN
        target_group := NEW.group_id;
    ELSE
        target_group := OLD.group_id;
    END IF;

    PERFORM 1
    FROM investigation_groups
    WHERE id = target_group
    FOR UPDATE;

    IF NOT FOUND THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;

        RAISE EXCEPTION 'Investigation group does not exist.';
    END IF;

    IF TG_OP = 'INSERT' THEN

        SELECT COUNT(*)
        INTO email_count
        FROM group_emails
        WHERE group_id = NEW.group_id;

        IF email_count >= 3 THEN
            RAISE EXCEPTION
                'A group cannot register more than 3 email addresses.';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM investigation_groups
            WHERE id = NEW.group_id
              AND is_active = TRUE
        ) THEN
            RAISE EXCEPTION
                'Deactivate the group before changing registered emails.';
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
BEFORE INSERT OR UPDATE OR DELETE
ON group_emails
FOR EACH ROW
EXECUTE FUNCTION enforce_three_group_emails();


-- =========================================================
-- 13. ENFORCE THREE LOGIN ACCOUNTS PER GROUP
-- Every login must correspond to a registered email.
-- =========================================================

CREATE OR REPLACE FUNCTION enforce_team_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION
            'Login identity fields cannot be updated through this operation.';
    END IF;

    PERFORM 1
    FROM investigation_groups
    WHERE id = NEW.group_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Investigation group does not exist.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM investigation_groups
        WHERE id = NEW.group_id
          AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION
            'The group must be active before creating login accounts.';
    END IF;

    SELECT COUNT(*)
    INTO user_count
    FROM team_users
    WHERE group_id = NEW.group_id;

    IF user_count >= 3 THEN
        RAISE EXCEPTION
            'A group can have only 3 login accounts.';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER limit_team_user_count
BEFORE INSERT OR UPDATE
ON team_users
FOR EACH ROW
EXECUTE FUNCTION enforce_team_user_limit();

CREATE OR REPLACE FUNCTION enforce_group_hint_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    hint_count INTEGER;
BEGIN
    PERFORM 1
    FROM investigation_groups
    WHERE id = NEW.group_id
      AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Group does not exist or is inactive.';
    END IF;

    PERFORM 1
    FROM hints
    WHERE id = NEW.hint_id
      AND is_active = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Hint does not exist or is inactive.';
    END IF;

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



CREATE INDEX idx_hint_events_group_time
    ON hint_access_events (group_id, accessed_at DESC);

CREATE INDEX idx_hint_events_user_time
    ON hint_access_events (user_id, accessed_at DESC);

CREATE INDEX idx_hint_unlocks_hint
    ON group_hint_unlocks (hint_id);

CREATE INDEX idx_group_emails_group
    ON group_emails (group_id);

CREATE INDEX idx_team_users_group
    ON team_users (group_id);

CREATE INDEX idx_mailbox_messages_folder
    ON mailbox_messages (mailbox_id, folder, created_at DESC);

CREATE INDEX idx_mailbox_attachments_message
    ON mailbox_attachments (message_id);

CREATE INDEX idx_mailbox_reads_message
    ON mailbox_message_reads (message_id);


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
