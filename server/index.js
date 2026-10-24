require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// Text shown for each {{TOKEN}} link. The URL itself comes from .env.
const LINK_LABELS = {
  MIRROR_DASHBOARD_URL: "Dashboard",
  GIT_REPO_URL: "Repository",
  NOTES_APP_URL: "Open Navya's Notes",
  DIRECTORY_URL: "Directory",
};

// "ORION Onboarding <onboarding@...>" -> { name, email }
function splitPerson(text) {
  const m = /^(.*)\s<([^>]+)>$/.exec(text || "");
  return m ? { name: m[1], email: m[2] } : { name: text || "", email: "" };
}

// Finds every {{TOKEN}} in a body and fills in its URL from .env.
function linksFor(body) {
  const names = [...new Set([...(body || "").matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((m) => m[1]))];
  return names.map((name) => ({
    token: `{{${name}}}`,
    label: LINK_LABELS[name] || name,
    url: process.env[name] || "",
  }));
}

// Turns a database row back into the shape the client already uses.
function toEmail(row) {
  const sender = splitPerson(row.sender);
  const recipient = splitPerson(row.recipient);
  return {
    id: row.mail_no,
    folder: row.folder.toLowerCase(),
    senderName: sender.name,
    senderEmail: sender.email,
    recipient: recipient.name,
    recipientEmail: recipient.email,
    cc: [],
    subject: row.subject,
    body: row.body,
    date: row.sent_at,
    isStarred: false,
    isRead: true, // No bold "unread" until teams can log in.
    links: linksFor(row.body),
    attachments: row.attachments,
  };
}

const EMAIL_QUERY = `
  SELECT e.*,
         COALESCE(
           json_agg(json_build_object('name', a.filename, 'filename', a.filename, 'url', a.file_path))
             FILTER (WHERE a.id IS NOT NULL),
           '[]'
         ) AS attachments
  FROM emails e
  LEFT JOIN attachments a ON a.email_id = e.id
`;

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// All emails, newest first. Optional: /api/emails?folder=inbox
app.get("/api/emails", async (req, res, next) => {
  try {
    const params = [];
    let where = "";
    if (req.query.folder) {
      params.push(req.query.folder);
      where = "WHERE lower(e.folder) = lower($1)";
    }
    const { rows } = await db.query(
      `${EMAIL_QUERY} ${where} GROUP BY e.id ORDER BY e.sent_at DESC`,
      params
    );
    res.json(rows.map(toEmail));
  } catch (err) {
    next(err);
  }
});

// One email by its number, e.g. /api/emails/1
app.get("/api/emails/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid email id" });

    const { rows } = await db.query(
      `${EMAIL_QUERY} WHERE e.mail_no = $1 GROUP BY e.id`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Email not found" });
    res.json(toEmail(rows[0]));
  } catch (err) {
    next(err);
  }
});

// Logs the real error, but only tells the browser something went wrong.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});