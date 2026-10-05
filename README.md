<div align="center">

# TaskFlow

**A team task tracker built end to end, front end to back end.**

[![CI](https://github.com/Crimeeee/TaskFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/Crimeeee/TaskFlow/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-24-5FA04E?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-crimson?style=flat-square)](#license)

</div>

---

## What it is

TaskFlow is a small task tracker for teams. You create a team, add boards, and move
cards across columns. It exists to demonstrate the whole path: a REST API with
authentication and permissions, a React client that consumes it, tests that prove
both work, and a pipeline that runs them on every push.

I built it end to end, including the database schema, the permission model and the
design system.

## Highlights

**Authentication that is actually enforced.** JWT access tokens, passwords hashed with
bcrypt. Every protected route re-checks team membership on the server, so the client
cannot reach another team's board by calling the API directly.

**A role model.** `OWNER`, `ADMIN` and `MEMBER`. The team creator is the owner. Owners
and admins can invite people; members can still create and move cards.

**Drag and drop that holds up.** Cards reorder within a column and move across columns
using `dnd-kit`. The new position is a midpoint between two neighbours, so a move writes
one row instead of renumbering the list. The update lands in the React Query cache
before the request resolves, and rolls back if the request fails.

**A design system instead of utility soup.** Colours are semantic tokens
(`bg-page`, `text-body`, `border-line`) defined once in CSS. Switching to dark mode
adds one class to the root element rather than scattering `dark:` prefixes across
twenty components.

**Tests where the logic lives.** 26 integration tests drive the real API through HTTP
and assert on status codes and response bodies, not on mocks.

## Stack

| Layer     | Choice                                                          |
| --------- | --------------------------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, dnd-kit |
| Backend   | Node 24, Express 5, TypeScript, `node:sqlite`, JWT, bcrypt, Zod  |
| Tests     | Vitest and Supertest                                             |
| Infra     | Docker, Docker Compose, GitHub Actions                          |

## Screens

<div align="center">

### Board

Cards move between columns and the activity feed records every change.

### Sign in

The sign-in screen pairs a dark brand panel with the form.

</div>

> Screenshots land here once the app is deployed. See [Deploy](#deploy).

## Quick start

Requires Node 24.

```bash
git clone https://github.com/Crimeeee/TaskFlow.git
cd TaskFlow
```

### Backend

```bash
cd backend
npm install
npm run seed      # demo board with 7 cards, safe to run repeatedly
npm run dev       # http://localhost:4000
```

The database is a single SQLite file at `backend/data/taskflow.db`. The schema is
applied at startup, so there is no migration step to install.

### Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

### Demo accounts

Populated by `npm run seed`:

| Email               | Password    | Role          |
| ------------------- | ----------- | ------------- |
| owner@taskflow.dev  | password123 | Head Developer |
| member@taskflow.dev | password123 | Developer     |

You can also register a new account from the sign-in screen.

### Docker

```bash
docker compose up --build
```

API on `localhost:4000`, web on `localhost:5173`.

## Your data survives restarts

Everything lives in `backend/data/taskflow.db`. Stopping the server and starting it
again keeps your data. There is nothing to re-run.

| Command            | Effect                                              |
| ------------------ | --------------------------------------------------- |
| `npm run seed`     | loads demo data only if none exists, deletes nothing |
| `npm run db:reset` | wipes everything and reloads the demo board          |

## Scripts

**backend/**

| Command             | Effect                              |
| ------------------- | ----------------------------------- |
| `npm run dev`       | API with reload on change           |
| `npm run build`     | compile TypeScript to `dist/`       |
| `npm test`          | integration tests, once             |
| `npm run typecheck` | type check without emitting         |
| `npm run seed`      | load demo data if empty             |
| `npm run db:reset`  | wipe and reload demo data           |

**frontend/**

| Command         | Effect                      |
| --------------- | --------------------------- |
| `npm run dev`   | Vite dev server             |
| `npm run build` | type check, then build      |
| `npm run lint`  | oxlint                      |

## API

Full reference with request and response shapes: [API.md](./API.md).

```
POST   /api/auth/register        POST   /api/teams
POST   /api/auth/login           GET    /api/teams
GET    /api/auth/me              GET    /api/teams/:teamId/members
GET    /api/health               POST   /api/teams/:teamId/members

POST   /api/boards               GET    /api/boards?teamId=
GET    /api/boards/:boardId      GET    /api/boards/:boardId/activity

POST   /api/boards/:boardId/columns
PATCH  /api/columns/:columnId
POST   /api/columns/:columnId/cards
PATCH  /api/cards/:cardId
DELETE /api/cards/:cardId
```

Every route except register, login and health requires `Authorization: Bearer <token>`.
Errors always come back as `{ "error": { "message": string } }`.

## How permissions work

A user has a role per team. Any authenticated request is checked against team
membership before the handler runs, so authorisation does not depend on the client.

```
users  ──<  memberships  >──  teams  ──<  boards  ──<  columns  ──<  cards
                                  └──<  activity
```

## Testing

```bash
cd backend && npm test
```

The suite covers registration and login, duplicate email rejection, bcrypt hashing,
missing and forged tokens, cross-team access, role checks on invites, the card
lifecycle, moving a card between columns, ordering by position, and the activity feed.

## Deploy

Backend on Railway, frontend on Render. The repository ships with a Dockerfile per
service and a Compose file for local use.

Environment variables are documented in [backend/.env.example](./backend/.env.example)
and [frontend/.env.example](./frontend/.env.example). Set `JWT_SECRET` to a long random
string in any deployed environment.

## Things I left unfinished

Naming them is the point of the exercise.

- **No rate limiting** on the auth routes. That is the first thing to add before this
  ran anywhere public.
- **Access tokens last seven days** and there is no refresh token flow.
- **Card positions drift.** Midpoint insertion avoids renumbering but can produce very
  small gaps after many moves. A periodic rebalance would fix it.
- **No frontend tests yet.** The backend is covered, the React layer is not.
- **SQLite only.** The queries are plain SQL and would move to Postgres with small
  changes, but nothing in the app depends on the SQLite specifics.

## License

[MIT](./LICENSE)
