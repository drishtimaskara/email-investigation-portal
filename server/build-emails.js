// Rebuilds client/src/data/emails.js from the .txt files in database/mailbox.
// Run from the server folder:  node build-emails.js
// Then reload the database:    node seed.js
//
// Each .txt file looks like:
//   Folder: Inbox
//   From: Name <email>
//   To: Name <email>
//   Cc: Name <email>, Name <email>     (optional)
//   Date: 2026-09-02T10:15:00+05:30
//   Subject: ...
//   Unread: Yes | No
//   Starred: Yes | No                  (optional)
//   Attachments: a.zip, b.pdf          (optional)
//   ------------------------------------------------------------
//   <body>

const fs = require("fs");
const path = require("path");

const SOURCE_DIR = path.resolve(process.argv[2] || path.join(__dirname, "..", "database", "mailbox"));
const OUTPUT_FILE = path.resolve(process.argv[3] || path.join(__dirname, "..", "client", "src", "data", "emails.js"));

// Text shown for each {{TOKEN}} link. Unknown tokens use their own name.
const LINK_LABELS = {
  MIRROR_DASHBOARD_URL: "Dashboard",
  GIT_REPO_URL: "Repository",
  NOTES_APP_URL: "Open Navya's Notes",
  DIRECTORY_URL: "Directory",
};

function findTxtFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findTxtFiles(full));
    else if (entry.name.toLowerCase().endsWith(".txt")) out.push(full);
  }
  return out;
}

// "Name <email>" -> { name, email }
function parsePerson(text) {
  const m = /^(.*?)\s*<([^>]+)>\s*$/.exec(text.trim());
  return m ? { name: m[1].trim(), email: m[2].trim() } : { name: text.trim(), email: "" };
}

// Splits "A <a@x>, B <b@x>" on commas outside the <...>
function parsePeople(text) {
  if (!text || !text.trim()) return [];
  return text.split(/,(?![^<]*>)/).map(parsePerson).filter((p) => p.name || p.email);
}

function yes(value) {
  return /^(yes|true|y|1)$/i.test((value || "").trim());
}

function parseFile(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");
  const sep = lines.findIndex((l) => /^-{10,}\s*$/.test(l));
  if (sep === -1) throw new Error("no ------ line between the headers and the body");

  const headers = {};
  for (const line of lines.slice(0, sep)) {
    const m = /^([A-Za-z]+)\s*:\s*(.*)$/.exec(line);
    if (m) headers[m[1].toLowerCase()] = m[2].trim();
  }
  for (const required of ["folder", "from", "to", "date", "subject"]) {
    if (!headers[required]) throw new Error(`missing "${required}:" header`);
  }
  headers.date = headers.date.split(/\s+/)[0]; // keeps the date, drops notes like "(last saved, never sent)"
  if (Number.isNaN(Date.parse(headers.date))) throw new Error(`bad date "${headers.date}"`);

  const body = lines.slice(sep + 1).join("\n").replace(/^\n+/, "").replace(/\s+$/, "");
  const from = parsePerson(headers.from);
  const to = parsePerson(headers.to);

  const tokens = [...new Set([...body.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)].map((m) => m[1]))];
  const attachments = (headers.attachments || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name, url: "" }));

  return {
    folder: headers.folder.toLowerCase(),
    senderName: from.name,
    senderEmail: from.email,
    recipient: to.name,
    recipientEmail: to.email,
    cc: parsePeople(headers.cc),
    subject: headers.subject,
    body,
    date: headers.date,
    isStarred: yes(headers.starred),
    isRead: !yes(headers.unread),
    links: tokens.map((t) => ({ token: `{{${t}}}`, label: LINK_LABELS[t] || t, url: "" })),
    attachments,
  };
}

// Keeps any url you already filled in for a link or attachment, matched by email id.
async function loadExistingUrls() {
  if (!fs.existsSync(OUTPUT_FILE)) return new Map();
  try {
    const { pathToFileURL } = require("url");
    const mod = await import(pathToFileURL(OUTPUT_FILE).href + "?t=" + Date.now());
    return new Map((mod.emails || []).map((e) => [e.id, e]));
  } catch {
    return new Map();
  }
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Folder not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  const files = findTxtFiles(SOURCE_DIR);
  const existing = await loadExistingUrls();
  const emails = [];
  const problems = [];
  const usedIds = new Set();

  for (const file of files) {
    const name = path.basename(file);
    try {
      const email = parseFile(file);
      const num = /^(\d+)/.exec(name);
      email.id = num ? Number(num[1]) : null;
      if (email.id === null) throw new Error("file name should start with a number, e.g. 23_Subject.txt");
      if (usedIds.has(email.id)) throw new Error(`number ${email.id} is used by another file`);
      usedIds.add(email.id);

      const old = existing.get(email.id);
      if (old) {
        for (const link of email.links) {
          const prev = (old.links || []).find((l) => l.token === link.token);
          if (prev && prev.url) link.url = prev.url;
        }
        for (const att of email.attachments) {
          const prev = (old.attachments || []).find((a) => (a.name || a.filename) === att.name);
          if (prev && prev.url) att.url = prev.url;
        }
      }
      emails.push(email);
    } catch (err) {
      problems.push(`${path.relative(SOURCE_DIR, file)}: ${err.message}`);
    }
  }

  emails.sort((a, b) => a.id - b.id);

  // Put id first so each entry reads like the old file.
  const ordered = emails.map(({ id, ...rest }) => ({ id, ...rest }));

  // The mailbox owner is whoever most emails are addressed to.
  const counts = {};
  for (const e of emails) {
    const key = `${e.recipient}|${e.recipientEmail}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const [ownerName, ownerEmail] = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["|"])[0].split("|");

  const output =
    `// Generated by server/build-emails.js from the .txt files in database/mailbox.\n` +
    `// Do not edit by hand: change the .txt files, then run "node build-emails.js" and "node seed.js".\n` +
    `// Dates are IST (+05:30). Field names match the planned \`emails\` table.\n` +
    `// links: each {{TOKEN}} in a body maps to an entry here. Real URLs come from server/.env.\n` +
    `// attachments: list them in a .txt file with "Attachments: a.zip, b.pdf". Any url filled in here is kept on rebuild.\n\n` +
    `export const currentUser = ${JSON.stringify({ name: ownerName, email: ownerEmail }, null, 2)}\n\n` +
    `export const emails = ${JSON.stringify(ordered, null, 2)}\n`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, output);

  const byFolder = {};
  for (const e of emails) byFolder[e.folder] = (byFolder[e.folder] || 0) + 1;
  console.log(`Read ${files.length} .txt files from ${SOURCE_DIR}`);
  console.log(`Wrote ${emails.length} emails to ${OUTPUT_FILE}`);
  console.log("By folder:", byFolder);

  const ids = emails.map((e) => e.id);
  const gaps = [];
  for (let i = 1; i < (ids[ids.length - 1] || 0); i++) if (!usedIds.has(i)) gaps.push(i);
  if (gaps.length) console.log("Missing numbers:", gaps.join(", "));

  if (problems.length) {
    console.log(`\nSkipped ${problems.length} file(s):`);
    for (const p of problems) console.log("  - " + p);
    process.exitCode = 1;
  }
}

main();