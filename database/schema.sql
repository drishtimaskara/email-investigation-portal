-- Teams of three taking part in the event
CREATE TABLE IF NOT EXISTS groups (
  id         SERIAL PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  group_id   INT REFERENCES groups(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- For the OTP login your server README mentions
CREATE TABLE IF NOT EXISTS otp_codes (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash  TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE
);

-- The case mailbox (same email-parsing seed as before)
CREATE TABLE IF NOT EXISTS emails (
  id         SERIAL PRIMARY KEY,
  mail_no    INT UNIQUE NOT NULL,
  folder     TEXT NOT NULL CHECK (folder IN ('Inbox','Sent','Drafts','Trash')),
  sender     TEXT,
  recipient  TEXT,
  sent_at    TIMESTAMPTZ,
  subject    TEXT,
  body       TEXT NOT NULL
);

-- Evidence files linked to an email (e.g. workstation_archive.zip)
CREATE TABLE IF NOT EXISTS attachments (
  id        SERIAL PRIMARY KEY,
  email_id  INT NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  filename  TEXT NOT NULL,
  file_path TEXT NOT NULL
);

-- Read/unread per team, so one team opening an email doesn't mark it read for everyone
CREATE TABLE IF NOT EXISTS email_reads (
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  email_id INT REFERENCES emails(id) ON DELETE CASCADE,
  read_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, email_id)
);
