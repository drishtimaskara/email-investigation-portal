require("dotenv").config();
const path = require("path");
const { pathToFileURL } = require("url");
const { emailDb } = require("./db"); // <-- Destructure emailDb here

const EMAILS_FILE = path.join(__dirname, "..", "client", "src", "data", "emails.js");

// "ORION Onboarding" + "onboarding@..." -> "ORION Onboarding <onboarding@...>"
function person(name, email) {
  if (name && email) return `${name} <${email}>`;
  return name || email || "";
}

async function main() {
  const { emails } = await import(pathToFileURL(EMAILS_FILE).href);
  const client = await emailDb.connect(); // <-- Use emailDb.connect()

  try {
    await client.query("BEGIN");
    // Start fresh each time, so running the seed twice doesn't duplicate emails.
    await client.query("TRUNCATE attachments, email_reads, emails RESTART IDENTITY CASCADE");

    let attachmentCount = 0;
    for (const e of emails) {
      const { rows } = await client.query(
        `INSERT INTO emails (mail_no, folder, sender, recipient, sent_at, subject, body)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          e.id,
          e.folder.charAt(0).toUpperCase() + e.folder.slice(1),
          person(e.senderName, e.senderEmail),
          person(e.recipient, e.recipientEmail),
          e.date,
          e.subject,
          e.body,
        ]
      );

      for (const a of e.attachments || []) {
        await client.query(
          "INSERT INTO attachments (email_id, filename, file_path) VALUES ($1, $2, $3)",
          [rows[0].id, a.filename || a.name, a.url || null]
        );
        attachmentCount++;
      }
    }

    await client.query("COMMIT");
    console.log(`Seeded ${emails.length} emails and ${attachmentCount} attachments.`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await emailDb.end(); // <-- Use emailDb.end()
  }
}

main();