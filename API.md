# TaskFlow API contract (v1)

Base URL: /api  ·  Content-Type: application/json
Auth: `Authorization: Bearer <accessToken>` on every route except register/login/health.

## Data shapes

```
User      { id, name, email, role? }
Team      { id, name, role }              # role = OWNER | ADMIN | MEMBER
Member    { id, name, email, role }
Board     { id, teamId, name, createdAt }
Column    { id, boardId, name, position, cards: Card[] }
Card      { id, columnId, title, description, position, assignee: User|null, dueDate: string|null, createdAt }
Activity  { id, boardId, message, createdAt }
```

Errors: always `{ "error": { "message": string } }` with status 400/401/403/404/409/422.

## Routes

### Health
- `GET /api/health` -> `{ status: "ok" }`

### Auth
- `POST /api/auth/register` body `{ name, email, password }` -> `{ user: User, accessToken }`
  email must be unique (409 on duplicate)
- `POST /api/auth/login` body `{ email, password }` -> `{ user: User, accessToken }`
- `GET /api/auth/me` -> `User`

### Teams
- `POST /api/teams` body `{ name }` -> `Team` (creator becomes OWNER)
- `GET /api/teams` -> `Team[]` (only teams the caller belongs to)
- `GET /api/teams/:teamId/members` -> `Member[]`
- `POST /api/teams/:teamId/members` body `{ email, role: "ADMIN"|"MEMBER" }` -> `Member`
  only OWNER or ADMIN, only ADMIN|MEMBER allowed

### Boards
- `POST /api/boards` body `{ teamId, name }` -> `Board` (caller must be team member)
- `GET /api/boards?teamId=<id>` -> `Board[]`
- `GET /api/boards/:boardId` -> `Board & { columns: Column[], team: Team }`

### Columns
- `POST /api/boards/:boardId/columns` body `{ name }` -> `Column`
  appends one column at the end. A new board is created with the four default columns
  (To do / In progress / In review / Done) already in place.
- `PATCH /api/columns/:columnId` body `{ name?, position? }` -> `Column`

### Cards
- `POST /api/columns/:columnId/cards` body `{ title, description?, assigneeId?, dueDate? }` -> `Card`
- `PATCH /api/cards/:cardId` body `{ title?, description?, position?, assigneeId?, dueDate?, columnId? }` -> `Card`
- `DELETE /api/cards/:cardId` -> `{ ok: true }`

### Activity
- `GET /api/boards/:boardId/activity` -> `Activity[]` (latest first, max 50)
  every card create/update/delete and column rename writes one entry

## Rules
- `position` is a float; insert between neighbours as `(prev + next) / 2`.
- Moving a card to another column is allowed through `PATCH /api/cards/:id` with `columnId`.
