# TaskFlow

A team task tracker with boards, drag and drop columns, roles and an activity feed.
Built as a full stack portfolio project: TypeScript on both sides, a REST API with
JWT auth and permissions, a React single page app, integration tests and CI.

## Screens

- Dashboard with the teams you belong to, team creation and member invites
- Board view with four columns, drag and drop cards, assignees and due dates
- Activity feed recording every card and column change

## Stack

| Layer    | Choice                                                        |
| -------- | ------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, dnd-kit |
| Backend  | Node 24, Express 5, TypeScript, node:sqlite, JWT, bcrypt, Zod |
| Tests    | Vitest + Supertest (26 integration tests)                     |
| Infra    | Docker, Docker Compose, GitHub Actions                        |

## Run it locally

Prerequisites: Node 24 and npm (see `engines` in each package.json).

```bash
git clone <your-repo-url>
cd taskflow
```

### Backend

```bash
cd backend
npm install
cp .env.example .env      # optional, sensible defaults exist
npm run seed              # optional demo data, safe to repeat
npm run dev               # http://localhost:4000
```

The database is a single SQLite file created at `backend/data/taskflow.db` on first run.
There is no migration step to install, the schema is applied at startup.

### Restarting does not lose data

Your data lives in `backend/data/taskflow.db`. Stopping the server with Ctrl+C and
starting it again keeps everything. You do not need to run the seed again.

| Command            | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `npm run seed`     | adds demo data only if none exists, never deletes anything |
| `npm run db:reset` | wipes everything and reloads the demo data                |

`npm run seed` is safe to repeat. It reports what it kept and leaves existing teams,
cards and accounts alone. Use `npm run db:reset` when you actually want a clean slate.

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

The frontend reads `VITE_API_URL` from `frontend/.env`, defaulting to
`http://localhost:4000/api`.

### Demo accounts

After `npm run seed` in `backend`:

| Email                | Password      | Role  |
| -------------------- | ------------- | ----- |
| owner@taskflow.dev   | password123   | Head Developer |
| member@taskflow.dev  | password123   | Developer   |

You can also register a new account from the login screen.

### With Docker

```bash
docker compose up --build
```

API on `http://localhost:4000`, web on `http://localhost:5173`.

## API

Full request and response reference: [API.md](./API.md).

Highlights:

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Teams, boards, columns, cards, activity
- Every route except register, login and health needs `Authorization: Bearer <token>`
- Errors always come back as `{ "error": { "message": string } }`

## How permissions work

Roles are `OWNER`, `ADMIN` and `MEMBER`. The creator of a team is its owner.
Owners and admins can invite members, everyone else can read and write cards on
boards of teams they belong to. The API checks membership on every request, so the
frontend cannot bypass it by calling endpoints directly.

## Data model

`users` -> `memberships` <- `teams` -> `boards` -> `columns` -> `cards`, plus
`activity` hanging off boards. Cards and columns carry a float `position`, so a drag
writes the midpoint between two neighbours instead of renumbering the list.

## Scripts

Backend, in `backend/`:

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | API with reload on change             |
| `npm run build`     | compile TypeScript to `dist/`         |
| `npm start`         | run the compiled server               |
| `npm test`          | integration tests once                |
| `npm run test:watch`| tests in watch mode                   |
| `npm run typecheck` | type check without emitting           |
| `npm run seed`      | load demo data if the database is empty     |
| `npm run db:reset` | wipe everything and reload demo data     |

Frontend, in `frontend/`:

| Command        | What it does                     |
| -------------- | -------------------------------- |
| `npm run dev`  | Vite dev server                  |
| `npm run build`| production build to `dist/`      |
| `npm run lint` | ESLint                          |

## Tests

```bash
cd backend && npm test
```

Coverage highlights: register and login, duplicate email, bcrypt hashing, forged and
missing tokens, cross team access, role checks on invites, card lifecycle, moving a
card between columns, ordering by position, and the activity feed.

## Notes and limitations

- SQLite through the Node built-in driver keeps setup to zero, so there is no database
  server to install. The queries are plain SQL and move to Postgres with small changes.
- Card positions use midpoint insertion, which avoids renumbering but can drift to very
  small gaps after many moves. A periodic rebalance would fix that in a bigger app.
- No refresh tokens yet, the JWT lasts seven days.
- No rate limiting on the auth routes, that would be the first thing to add before this
  went anywhere public.
