require("dotenv").config();
const path = require("path");
const { pathToFileURL } = require("url");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { db, hashPassword, verifyPassword } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "arg-investigation-portal-secret-key-2026";
const MAX_HINTS_PER_USER = 5;
const EMAILS_FILE = path.resolve(__dirname, "..", "client", "src", "data", "emails.js");

const app = express();
app.use(cors());
app.use(express.json());

// Fallback link labels if token label not specified in emails.js
const LINK_LABELS = {
  MIRROR_DASHBOARD_URL: "Dashboard",
  GIT_REPO_URL: "Repository",
  NOTES_APP_URL: "Open Navya's Notes",
  DIRECTORY_URL: "Directory",
};

// Dynamically loads the latest emails directly from client/src/data/emails.js.
// Any edits to emails.js immediately reflect without needing database resets or restarts.
async function getEmails() {
  const fileUrl = pathToFileURL(EMAILS_FILE).href + `?t=${Date.now()}`;
  const mod = await import(fileUrl);
  const emailsList = mod.emails || [];

  return emailsList.map((email) => {
    const links = (email.links || []).map((l) => {
      const tokenName = l.token.replace(/^\{\{|\}\}$/g, "");
      return {
        ...l,
        label: l.label || LINK_LABELS[tokenName] || tokenName,
        url: l.url || process.env[tokenName] || "",
      };
    });

    return {
      ...email,
      folder: (email.folder || "inbox").toLowerCase(),
      links,
      attachments: email.attachments || [],
    };
  });
}

// Authentication middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare("SELECT id, username, display_name, role FROM users WHERE id = ?").get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }
    req.user = {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
    };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Admin authorization middleware
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Administrator privileges required" });
  }
  next();
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// --- Auth Routes ---

// Login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  const user = db.prepare("SELECT * FROM users WHERE LOWER(username) = LOWER(?)").get(username.trim());
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      role: user.role,
    },
  });
});

// Current user details
app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// --- Emails Routes ---

// Returns protagonist Navya Mulay's emails from emails.js (optionally filtered by ?folder=...)
app.get("/api/emails", authMiddleware, async (req, res, next) => {
  try {
    const list = await getEmails();
    if (req.query.folder) {
      const folder = req.query.folder.toLowerCase();
      return res.json(list.filter((e) => e.folder === folder));
    }
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// One email by its number, e.g. /api/emails/1
app.get("/api/emails/:id", authMiddleware, async (req, res, next) => {
  try {
    const list = await getEmails();
    const found = list.find((e) => String(e.id) === String(req.params.id));
    if (!found) return res.status(404).json({ error: "Email not found" });
    res.json(found);
  } catch (err) {
    next(err);
  }
});

// --- Hints Routes ---

const MODULE_NAMES = ["Git", "MIRROR", "Notes", "OSINT"];

// Get hints summary for the logged-in player
// Note: Locked hints NEVER include hint content, preventing client-side inspection.
app.get("/api/hints", authMiddleware, (req, res, next) => {
  try {
    const userId = req.user.id;

    const userUnlocks = db.prepare(`
      SELECT hu.module, hu.hint_number, hu.unlocked_at, h.content
      FROM hint_unlocks hu
      JOIN hints h ON h.id = hu.hint_id
      WHERE hu.user_id = ?
      ORDER BY hu.hint_number ASC
    `).all(userId);

    const modules = {};
    for (const mod of MODULE_NAMES) {
      const unlockedInMod = userUnlocks.filter((u) => u.module.toLowerCase() === mod.toLowerCase());
      const totalAvailable = db.prepare("SELECT COUNT(*) AS count FROM hints WHERE LOWER(module) = LOWER(?)").get(mod).count;

      modules[mod] = {
        totalAvailable,
        unlockedCount: unlockedInMod.length,
        unlockedHints: unlockedInMod.map((u) => ({
          number: u.hint_number,
          content: u.content,
          unlockedAt: u.unlocked_at,
        })),
        nextHintNumber: unlockedInMod.length < totalAvailable ? unlockedInMod.length + 1 : null,
      };
    }

    res.json({
      totalUnlocked: userUnlocks.length,
      maxHints: MAX_HINTS_PER_USER,
      modules,
    });
  } catch (err) {
    next(err);
  }
});

// Unlock next hint for module
app.post("/api/hints/unlock", authMiddleware, (req, res, next) => {
  try {
    const { module: requestedModule } = req.body;
    if (!requestedModule) {
      return res.status(400).json({ error: "Module name is required" });
    }

    const matchedMod = MODULE_NAMES.find((m) => m.toLowerCase() === requestedModule.trim().toLowerCase());
    if (!matchedMod) {
      return res.status(400).json({ error: `Invalid module. Available modules: ${MODULE_NAMES.join(", ")}` });
    }

    const userId = req.user.id;

    // 1. Enforce max hint limit
    const totalUnlockedCount = db.prepare("SELECT COUNT(*) AS count FROM hint_unlocks WHERE user_id = ?").get(userId).count;
    if (totalUnlockedCount >= MAX_HINTS_PER_USER) {
      return res.status(400).json({
        error: `Hint limit reached. You can only unlock up to ${MAX_HINTS_PER_USER} hints in total.`,
      });
    }

    // 2. Find next hint number for this module
    const lastUnlocked = db.prepare(`
      SELECT MAX(hint_number) AS maxNum
      FROM hint_unlocks
      WHERE user_id = ? AND LOWER(module) = LOWER(?)
    `).get(userId, matchedMod);

    const nextNumber = (lastUnlocked.maxNum || 0) + 1;

    // 3. Find the hint in the hints catalogue
    const hint = db.prepare("SELECT * FROM hints WHERE LOWER(module) = LOWER(?) AND hint_number = ?").get(matchedMod, nextNumber);
    if (!hint) {
      return res.status(400).json({
        error: `All available hints for ${matchedMod} have already been unlocked.`,
      });
    }

    // 4. Save unlock record
    const insertUnlock = db.prepare(`
      INSERT INTO hint_unlocks (user_id, hint_id, module, hint_number, unlocked_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `);
    insertUnlock.run(userId, hint.id, matchedMod, nextNumber);

    res.json({
      success: true,
      unlockedHint: {
        module: matchedMod,
        number: nextNumber,
        content: hint.content,
        unlockedAt: new Date().toISOString(),
      },
      totalUnlocked: totalUnlockedCount + 1,
      maxHints: MAX_HINTS_PER_USER,
    });
  } catch (err) {
    next(err);
  }
});

// --- Admin Routes ---

// List all users and their hint stats
app.get("/api/admin/users", authMiddleware, adminMiddleware, (req, res, next) => {
  try {
    const users = db.prepare(`
      SELECT u.id, u.username, u.display_name, u.role, u.created_at,
             COUNT(hu.id) AS hints_used
      FROM users u
      LEFT JOIN hint_unlocks hu ON hu.user_id = u.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();

    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// Create new user account
app.post("/api/admin/users", authMiddleware, adminMiddleware, (req, res, next) => {
  try {
    const { username, password, displayName, role } = req.body;

    if (!username || typeof username !== "string" || username.trim().length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters" });
    }
    if (!password || typeof password !== "string" || password.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    }

    const cleanUsername = username.trim();
    const existing = db.prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?)").get(cleanUsername);
    if (existing) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const cleanDisplayName = (displayName && displayName.trim()) || cleanUsername;
    const cleanRole = role === "admin" ? "admin" : "player";
    const passwordHash = hashPassword(password);

    const result = db.prepare(`
      INSERT INTO users (username, password_hash, display_name, role)
      VALUES (?, ?, ?, ?)
    `).run(cleanUsername, passwordHash, cleanDisplayName, cleanRole);

    res.status(201).json({
      success: true,
      user: {
        id: result.lastInsertRowid,
        username: cleanUsername,
        displayName: cleanDisplayName,
        role: cleanRole,
        hints_used: 0,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Delete user account
app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (!Number.isInteger(targetId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (targetId === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(targetId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    db.prepare("DELETE FROM users WHERE id = ?").run(targetId);
    res.json({ success: true, message: `User '${user.username}' deleted successfully` });
  } catch (err) {
    next(err);
  }
});

// Hint access audit logs
app.get("/api/admin/hints-log", authMiddleware, adminMiddleware, (req, res, next) => {
  try {
    const logs = db.prepare(`
      SELECT hu.id, hu.unlocked_at, hu.module, hu.hint_number,
             u.id AS user_id, u.username, u.display_name,
             h.content AS hint_content
      FROM hint_unlocks hu
      JOIN users u ON u.id = hu.user_id
      JOIN hints h ON h.id = hu.hint_id
      ORDER BY hu.unlocked_at DESC
    `).all();

    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

// Admin stats
app.get("/api/admin/stats", authMiddleware, adminMiddleware, (req, res, next) => {
  try {
    const totalUsers = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'player'").get().count;
    const totalHintsUnlocked = db.prepare("SELECT COUNT(*) AS count FROM hint_unlocks").get().count;

    const moduleBreakdown = db.prepare(`
      SELECT module, COUNT(*) AS count
      FROM hint_unlocks
      GROUP BY module
    `).all();

    res.json({
      totalUsers,
      totalHintsUnlocked,
      moduleBreakdown,
    });
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
