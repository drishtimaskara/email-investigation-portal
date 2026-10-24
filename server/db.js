const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const crypto = require("crypto");

const DB_DIR = path.resolve(__dirname, "..", "database");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.SQLITE_DB_PATH || path.join(DB_DIR, "investigation.db");
const db = new Database(DB_PATH);

// Configure SQLite pragmas
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

// Password hashing helpers using Node.js built-in crypto
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(key, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

// Initialize tables if they don't exist
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'player',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      hint_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (module, hint_number)
    );

    CREATE TABLE IF NOT EXISTS hint_unlocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      hint_id INTEGER NOT NULL REFERENCES hints(id) ON DELETE CASCADE,
      module TEXT NOT NULL,
      hint_number INTEGER NOT NULL,
      unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (user_id, hint_id)
    );

    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mail_no INTEGER UNIQUE NOT NULL,
      folder TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      cc TEXT NOT NULL DEFAULT '[]',
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      sent_at TEXT NOT NULL,
      is_starred INTEGER NOT NULL DEFAULT 0,
      is_read INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_id INTEGER NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      url TEXT
    );
  `);

  // Seed default admin and initial player if users table is empty
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role)
      VALUES (?, ?, ?, ?)
    `);

    insertUser.run("admin", hashPassword("admin123"), "Game Master", "admin");
    insertUser.run("player1", hashPassword("player123"), "Investigator Group 1", "player");
    insertUser.run("investigator", hashPassword("investigator123"), "Lead Investigator", "player");
    console.log("Seeded initial users: admin, player1, investigator");
  }

  // Seed hints if hints table is empty
  const hintCount = db.prepare("SELECT COUNT(*) AS count FROM hints").get().count;
  if (hintCount === 0) {
    const HINTS_SEED = [
      { module: "Git", number: 1, content: "The current branch is not the whole story." },
      { module: "Git", number: 2, content: "Look at commit metadata and removed files." },
      { module: "Git", number: 3, content: "Compare author and committer dates; recover validation_summary.md." },

      { module: "MIRROR", number: 1, content: "Anonymous does not always mean unidentifiable." },
      { module: "MIRROR", number: 2, content: "Compare retained attributes with the separate roster." },
      { module: "MIRROR", number: 3, content: "Match MIR-1042 and inspect the sync/export diagnostics." },

      { module: "Notes", number: 1, content: "The activity log knows more than the notes list." },
      { module: "Notes", number: 2, content: "Check the unknown device and Settings." },
      { module: "Notes", number: 3, content: "The version number opens the private note." },

      { module: "OSINT", number: 1, content: "A username is not a person." },
      { module: "OSINT", number: 2, content: "Compare the directory with older announcements." },
      { module: "OSINT", number: 3, content: "Find the historical purpose of orion-review-17." },
    ];

    const insertHint = db.prepare(`
      INSERT INTO hints (module, hint_number, content)
      VALUES (?, ?, ?)
    `);

    const seedHintsTransaction = db.transaction((hints) => {
      for (const h of hints) {
        insertHint.run(h.module, h.number, h.content);
      }
    });

    seedHintsTransaction(HINTS_SEED);
    console.log(`Seeded ${HINTS_SEED.length} hints.`);
  }

  // Seed emails if emails table is empty
  const emailCount = db.prepare("SELECT COUNT(*) AS count FROM emails").get().count;
  if (emailCount === 0) {
    const emailsFile = path.resolve(__dirname, "..", "client", "src", "data", "emails.js");
    if (fs.existsSync(emailsFile)) {
      try {
        const emailsContent = fs.readFileSync(emailsFile, "utf8");
        const emailsMatch = emailsContent.match(/export const emails = (\[[\s\S]*?\]);?\s*$/);
        if (emailsMatch) {
          const emails = JSON.parse(emailsMatch[1]);
          const insertEmail = db.prepare(`
            INSERT INTO emails (mail_no, folder, sender_name, sender_email, recipient_name, recipient_email, cc, subject, body, sent_at, is_starred, is_read)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          const insertAttachment = db.prepare(`
            INSERT INTO attachments (email_id, name, url)
            VALUES (?, ?, ?)
          `);

          const seedEmailsTx = db.transaction((list) => {
            for (const e of list) {
              const res = insertEmail.run(
                e.id,
                e.folder.toLowerCase(),
                e.senderName || "",
                e.senderEmail || "",
                e.recipient || "",
                e.recipientEmail || "",
                JSON.stringify(e.cc || []),
                e.subject || "",
                e.body || "",
                e.date || "",
                e.isStarred ? 1 : 0,
                e.isRead ? 1 : 0
              );
              for (const a of e.attachments || []) {
                insertAttachment.run(res.lastInsertRowid, a.name || a.filename || "file", a.url || "");
              }
            }
          });

          seedEmailsTx(emails);
          console.log(`Seeded ${emails.length} emails from emails.js`);
        }
      } catch (err) {
        console.error("Failed to seed emails from emails.js:", err.message);
      }
    }
  }
}

initSchema();

module.exports = {
  db,
  hashPassword,
  verifyPassword,
};
