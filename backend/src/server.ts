import { existsSync, statSync } from "node:fs";
import { openDb } from "./db/index.js";
import { createApp } from "./app.js";
import { config } from "./config.js";

const file = config.dbFile;
// A missing or empty file means a fresh start, so the log says so instead of silently recreating it.
if (file !== ":memory:" && (!existsSync(file) || statSync(file).size === 0))
  console.log(`[taskflow] no database at ${file}, starting with an empty one. Run "npm run seed" for demo data.`);

const db = openDb(file);
createApp(db).listen(config.port, () => {
  console.log(`TaskFlow API on http://localhost:${config.port}`);
  console.log(`Database: ${file}`);
});
