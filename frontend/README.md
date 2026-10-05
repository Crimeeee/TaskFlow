# TaskFlow frontend

React 19 + TypeScript single page app for TaskFlow, a Trello style team task tracker.

## Stack

- Vite, React 19, TypeScript
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- react-router-dom for routing
- @tanstack/react-query for server state
- axios for HTTP
- @dnd-kit/core + @dnd-kit/sortable for card drag and drop
- lucide-react for icons

## Setup

```bash
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:4000/api
npm run dev
```

The app talks to the TaskFlow API described in `../API.md`. Without `VITE_API_URL`
it falls back to `http://localhost:4000/api`.

## Scripts

| script | what it does |
| --- | --- |
| `npm run dev` | start the dev server |
| `npm run build` | type check with `tsc -b` then build to `dist/` |
| `npm run preview` | serve the production build |
| `npm run lint` | run oxlint |
| `npm run typecheck` | type check only |

## Layout

```
src/
  lib/api.ts         axios instance, token storage, 401 handling
  lib/types.ts       types mirroring the API contract
  lib/queries.ts     react-query hooks for every endpoint
  lib/board.ts       position maths and in-memory card moves
  context/           AuthContext (user, token, login/register/logout)
  hooks/useToast.tsx toast provider and hook
  components/        reusable UI
  pages/             Login, Register, Dashboard, Board, NotFound
  routes.tsx         route table, protected routes
```

## Routes

| path | access |
| --- | --- |
| `/login` | public |
| `/register` | public |
| `/` | dashboard, protected |
| `/boards/:boardId` | board, protected |
| anything else | redirects to `/404` |

## Notes

- The access token lives in localStorage under `taskflow_token`.
- A 401 from the API clears the token and redirects to `/login`.
- Card positions are floats. A drop computes the midpoint of its new neighbours and
  sends it in `PATCH /cards/:id` with the target `columnId`.
