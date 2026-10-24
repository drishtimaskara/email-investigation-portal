const path = require("path");
const { pathToFileURL } = require("url");
const db = require("./db");

async function main() {
  const { rows } = await db.query(
    "SELECT pg_get_constraintdef(oid) AS rule FROM pg_constraint WHERE conname = 'emails_folder_check'"
  );
  console.log("Database allows:", rows[0] && rows[0].rule);

  const file = path.join(__dirname, "..", "client", "src", "data", "emails.js");
  const { emails } = await import(pathToFileURL(file).href);
  console.log("emails.js uses:", [...new Set(emails.map((e) => e.folder))]);

  await db.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});