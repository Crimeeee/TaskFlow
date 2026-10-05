<div align="center">

<img src="public/favicon.svg" width="64" height="64" alt="TaskFlow logo">

# TaskFlow

**A team task tracker, built end to end.**

[![CI](https://github.com/Crimeeee/TaskFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/Crimeeee/TaskFlow/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node-24-5FA04E?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-crimson?style=flat-square)](#license)

[Demo](#quick-start) · [Stack](#stack) · [API](#api) · [Design notes](#design-notes) · [Status](#honest-status)

</div>

---

## The problem

Most portfolio projects are a CRUD app that anyone could have copied from a tutorial.
This one is a small product with the parts that actually break in production:
authentication, per team authorisation, ordering, and a client that stays consistent
while the server is slow.

Everything here was written by me, including the schema, the permission model and the
design system.

## What it does

- **Teams** with three roles: `OWNER`, `ADMIN`, `MEMBER`
- **Boards** with four columns, created automatically with the board
- **Cards** with title, description, assignee and due date
- **Drag and drop** to reorder inside a column or move across columns
- **Activity feed** recording every card and column change
- **Dark mode** with a custom colour system

<p align="center">
  <em>Screenshots go here after deploy. The app is not public yet.</em>
</p>

## Architecture

```
┌─────────────────┐        HTTPS / JSON        ┌──────────────────────┐
│   React 19 SPA  │  ───────────────────────►  │   Express 5 API      │
│                 │  ◄───────────────────────  │                      │
│  Tailwind · dnd  │    Authorization: Bearer   │  Zod · JWT · bcrypt  │
│  TanStack Query  │                            └───────────┬──────────┘
└─────────────────┘                                        │
                                                             ▼
                                              ┌──────────────────────┐
                                              │  SQLite (node:sqlite)│
                                              └──────────────────────┘
```

```
users ──< memberships >── teams ──< boards ──< columns ──< cards
                                  └──< activity
```

Cards and columns carry a float `position`. A move writes the midpoint between the two
neighbours instead of renumbering the list, so dragging one card is a single `UPDATE`.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite | Fast iteration, strict types across the API boundary |
| Styling | Tailwind CSS 4 | Semantic colour tokens, so dark mode is one class on the root |
| Server state | TanStack Query | Optimistic updates with automatic rollback on failure |
| Drag and drop | dnd-kit | Accessible primitives, works with touch |
| Backend | Node 24, Express 5 | Type sharing with the frontend through one language |
| Database | `node:sqlite` | No native build step, no server to install, plain SQL |
| Validation | Zod | One schema per route, shared error shape |
| Tests | Vitest, Supertest | Runs against the real app, no mocked database |
| CI | GitHub Actions | Typecheck, lint and tests on every push |

## Quick start

Requires Node 24.

```bash
git clone https://github.com/Crimeeee/TaskFlow.git
cd TaskFlow

# terminal 1
cd backend && npm install && npm run seed && npm run dev   # :4000

# terminal 2
cd frontend && npm install && npm run dev                  # :5173
```

Demo accounts created by the seed:

| Email | Password | Role |
| --- | --- | --- |
| `owner@taskflow.dev` | `password123` | Head Developer |
| `member@taskflow.dev` | `password123` | Developer |

Or register your own from the sign in screen.

With Docker:

```bash
docker compose up --build
```

## Commands

| Command | Where | What it does |
| --- | --- | --- |
| `npm run dev` | both | dev server with reload |
| `npm run build` | both | type check, then production build |
| `npm test` | backend | 26 integration tests |
| `npm run lint` | frontend | oxlint |
| `npm run typecheck` | backend | types only, no emit |
| `npm run seed` | backend | demo data, only if the database is empty |
| `npm run db:reset` | backend | wipe everything, reload demo data |

Your data lives in `backend/data/taskflow.db`. Restarting the server does not lose it,
and the seed never deletes anything unless you ask for `db:reset`.

## API

Base URL `/api`. Everything except register, login and health needs
`Authorization: Bearer <token>`. Errors are always `{ "error": { "message": string } }`.

```
POST   /api/auth/register         POST   /api/teams
POST   /api/auth/login            GET    /api/teams
GET    /api/auth/me               GET    /api/teams/:teamId/members
GET    /api/health                POST   /api/teams/:teamId/members

POST   /api/boards                GET    /api/boards/:boardId
GET    /api/boards?teamId=        GET    /api/boards/:boardId/activity
POST   /api/boards/:boardId/columns
PATCH  /api/columns/:columnId
POST   /api/columns/:columnId/cards
PATCH  /api/cards/:cardId
DELETE /api/cards/:cardId
```

Full reference with request and response shapes: [API.md](./API.md).

Authorisation is enforced server side. Every handler re-reads team membership before it
touches data, so calling the API directly cannot bypass the UI.

## Design notes

**Colour tokens, not colour classes.** Every surface is a token defined once in CSS
(`--surface-page`, `--text-body`, `--line-soft`). Dark mode swaps the token values in
one block. I first built it with raw Tailwind classes and it took 200 `dark:` prefixes
to make both themes readable.

**Optimistic drag and drop.** The card moves in the UI before the request is sent. The
previous cache snapshot is kept and restored if the `PATCH` fails, then a toast
explains what happened.

**Bugs the tests caught.** Zod validates `.min()` before `.trim()`, so a card titled
with a single space passed validation and was stored blank. A column route was mounted
under `/api/boards` while the client called `/api/columns`. Both shipped, both were
caught by writing the tests.

## Testing

```bash
cd backend && npm test
```

26 integration tests drive the real Express app over HTTP and assert on status codes and
response bodies:

| Area | Covered |
| --- | --- |
| Auth | register, login, duplicate email, short password, bcrypt hashing |
| Tokens | missing, forged, expired, deleted user |
| Permissions | cross team reads, role checks on invites, board creation for outsiders |
| Cards | create, edit, delete, empty title, assignee must be a member |
| Ordering | move across columns, order by position, reject cross board moves |
| Activity | card and column events recorded newest first |

```
Tests  26 passed (26)
Duration  2.96s
```

## Honest status

What is not done, in the order I would fix it:

1. **No frontend tests.** The React layer is untested. This is the biggest gap.
2. **No rate limiting** on the auth routes. First thing to add before this ran anywhere public.
3. **No refresh tokens.** Access tokens last seven days, then you sign in again.
4. **Position drift.** Midpoint insertion can produce very small gaps after many moves. Needs a periodic rebalance.
5. **SQLite only.** The queries are plain SQL and would move to Postgres with small changes.

## Project size

| | |
| --- | --- |
| Backend source | 776 lines |
| Frontend source | 2443 lines |
| Integration tests | 290 lines |
| Components | 18 |
| Endpoints | 17 |

## License

[MIT](./LICENSE)
