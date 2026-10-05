import bcrypt from "bcryptjs";
import { openDb } from "./db/index.js";
import { newId } from "./lib/id.js";
import { config } from "./config.js";

const db = openDb(config.dbFile);

// Destructive only on request, so a routine `npm run seed` never wipes real accounts.
const fresh = process.argv.includes("--fresh");
if (fresh) {
  db.exec(
    "DELETE FROM activity; DELETE FROM cards; DELETE FROM columns; DELETE FROM boards; DELETE FROM memberships; DELETE FROM teams; DELETE FROM users;",
  );
}

const hash = bcrypt.hashSync("password123", 10);

const ensureUser = (name: string, email: string): string => {
  const found = db.prepare("SELECT id, name FROM users WHERE email = ?").get(email) as
    | { id: string; name: string }
    | undefined;
  if (found) {
    if (found.name !== name) db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, found.id);
    return found.id;
  }
  const id = newId();
  db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(id, name, email, hash);
  return id;
};

const owner = ensureUser("Head Developer", "owner@taskflow.dev");
const member = ensureUser("Developer", "member@taskflow.dev");

const existingTeam = db.prepare("SELECT id FROM teams WHERE name = ?").get("Website Redesign") as
  | { id: string }
  | undefined;

if (existingTeam) {
  const { count } = db
    .prepare("SELECT COUNT(*) AS count FROM teams")
    .get() as { count: number };
  console.log(`Kept ${count} existing team(s). Use "npm run db:reset" to wipe demo data.`);
  console.log("Demo logins: owner@taskflow.dev / member@taskflow.dev, password: password123");
  process.exit(0);
}

const teamId = newId();
db.prepare("INSERT INTO teams (id, name) VALUES (?, ?)").run(teamId, "Website Redesign");
db.prepare("INSERT INTO memberships (team_id, user_id, role) VALUES (?, ?, 'OWNER')").run(teamId, owner);
db.prepare("INSERT INTO memberships (team_id, user_id, role) VALUES (?, ?, 'MEMBER')").run(teamId, member);

const boardId = newId();
db.prepare("INSERT INTO boards (id, team_id, name) VALUES (?, ?, ?)").run(boardId, teamId, "Sprint 1");

const columns = ["To do", "In progress", "In review", "Done"];
const columnIds = columns.map((name, i) => {
  const id = newId();
  db.prepare("INSERT INTO columns (id, board_id, name, position) VALUES (?, ?, ?, ?)").run(id, boardId, name, (i + 1) * 1000);
  return id;
});

const cards: [number, string, string, string | null][] = [
  [0, "Design the header component", "Match the Figma file, mobile first.", member],
  [0, "Set up ESLint and Prettier", "Keep CI green.", null],
  [1, "Build the auth screens", "Login, register, forgot password.", owner],
  [1, "Connect the API client", "Axios instance with auth interceptor.", owner],
  [2, "Review pull request #42", "Waiting on two approvals.", member],
  [3, "Project kickoff", "Kickoff with the whole team.", null],
  [3, "Set up CI pipeline", "Typecheck, lint and tests on push.", owner],
];

cards.forEach(([col, title, description, assignee], i) => {
  db.prepare(
    `INSERT INTO cards (id, column_id, title, description, position, assignee_id, due_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(newId(), columnIds[col], title, description, (i + 1) * 500, assignee, i % 3 === 0 ? "2026-03-20" : null);
});

db.prepare("INSERT INTO activity (id, board_id, user_id, message) VALUES (?, ?, ?, ?)").run(
  newId(),
  boardId,
  owner,
  'added card "Build the auth screens"',
);

const { n } = db.prepare("SELECT COUNT(*) AS n FROM cards").get() as { n: number };
console.log(`Seeded demo board with ${n} cards.`);
console.log("Demo logins: owner@taskflow.dev / member@taskflow.dev, password: password123");
