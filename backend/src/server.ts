import { openDb } from "./db/index.js";
import { createApp } from "./app.js";
import { config } from "./config.js";

const db = openDb(config.dbFile);
createApp(db).listen(config.port, () => {
  console.log(`TaskFlow API on http://localhost:${config.port}`);
});
