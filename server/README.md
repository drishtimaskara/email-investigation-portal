# Server — Backend

## Purpose
Express.js backend providing authentication, secure progressive hint unlocking with quota enforcement, admin management, and email APIs.

## Architecture
- **Database (`db.js`):** SQLite (`better-sqlite3`) storing dynamic application state:
  - `users`: Admin and player team accounts.
  - `hints`: The secret hint catalogue (hidden from players).
  - `hint_unlocks`: Audit records of which player unlocked which hint and when.
- **Emails:** Pre-written story emails are loaded dynamically from `client/src/data/emails.js`. Edits to emails in `emails.js` reflect immediately without needing database resets.
- **Security:** JWT authentication via `Bearer` token.
