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

// Initialize tables: users, hints, and hint_unlocks
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
  `);

  // Seed default admin if users table is empty
  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role)
      VALUES (?, ?, ?, ?)
    `);

    insertUser.run("admin", hashPassword("admin123"), "Game Master", "admin");
  }

  // Seed hints catalogue if empty
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

    const seedHintsTx = db.transaction((hints) => {
      for (const h of hints) {
        insertHint.run(h.module, h.number, h.content);
      }
    });

    seedHintsTx(HINTS_SEED);
  }
}

initSchema();

module.exports = {
  db,
  hashPassword,
  verifyPassword,
};
