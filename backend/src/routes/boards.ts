import { Router } from "express";
import { z } from "zod";
import { newId } from "../lib/id.js";
import { badRequest, forbidden, notFound, unprocessable } from "../lib/errors.js";
import { requireAuth, teamRole } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

const DEFAULT_COLUMNS = ["To do", "In progress", "In review", "Done"];

const boardBody = z.object({ teamId: z.string().min(1), name: z.string().trim().min(1).max(80) });
const columnBody = z.object({ name: z.string().trim().min(1).max(80) });
const columnPatch = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  position: z.number().optional(),
});

export const columnsRouter = Router();
columnsRouter.use(requireAuth);

export const boardsRouter = Router();
boardsRouter.use(requireAuth);

boardsRouter.post("/", (req, res, next) => {
  const parsed = boardBody.safeParse(req.body);
  if (!parsed.success) return next(unprocessable("Provide teamId and a board name"));

  if (!teamRole(req.db, parsed.data.teamId, req.user!.id))
    return next(forbidden("You are not a member of that team"));

  const id = newId();
  req.db.prepare("INSERT INTO boards (id, team_id, name) VALUES (?, ?, ?)").run(
    id,
    parsed.data.teamId,
    parsed.data.name,
  );
  DEFAULT_COLUMNS.forEach((name, i) => {
    req.db
      .prepare("INSERT INTO columns (id, board_id, name, position) VALUES (?, ?, ?, ?)")
      .run(newId(), id, name, (i + 1) * 1000);
  });
  logActivity(req.db, id, req.user!.id, `created board "${parsed.data.name}"`);
  res.status(201).json({ id, teamId: parsed.data.teamId, name: parsed.data.name });
});

boardsRouter.get("/", (req, res) => {
  const teamId = String(req.query.teamId ?? "");
  if (!teamRole(req.db, teamId, req.user!.id)) return res.json([]);
  const boards = req.db
    .prepare("SELECT id, team_id AS teamId, name, created_at AS createdAt FROM boards WHERE team_id = ? ORDER BY name")
    .all(teamId);
  res.json(boards);
});

boardsRouter.get("/:boardId", (req, res, next) => {
  const board = req.db
    .prepare("SELECT id, team_id, name, created_at FROM boards WHERE id = ?")
    .get(req.params.boardId) as { id: string; team_id: string; name: string; created_at: string } | undefined;
  if (!board) return next(notFound("Board not found"));
  if (!teamRole(req.db, board.team_id, req.user!.id)) return next(forbidden("You are not a member of that team"));

  const columns = req.db
    .prepare("SELECT id, board_id AS boardId, name, position FROM columns WHERE board_id = ? ORDER BY position")
    .all(board.id) as { id: string; name: string; position: number }[];

  const cards = req.db
    .prepare(
      `SELECT c.id, c.column_id AS columnId, c.title, c.description, c.position,
              c.assignee_id AS assigneeId, c.due_date AS dueDate, c.created_at AS createdAt,
              u.name AS assigneeName, u.email AS assigneeEmail
       FROM cards c LEFT JOIN users u ON u.id = c.assignee_id
       WHERE c.column_id IN (SELECT id FROM columns WHERE board_id = ?)
       ORDER BY c.position`,
    )
    .all(board.id) as Record<string, string | number | null>[];

  const withCards = columns.map((c) => ({
    ...c,
    cards: cards
      .filter((card) => card.columnId === c.id)
      .map((card) => ({
        id: card.id as string,
        columnId: card.columnId as string,
        title: card.title as string,
        description: card.description as string,
        position: card.position as number,
        dueDate: card.dueDate as string | null,
        createdAt: card.createdAt as string,
        assignee:
          card.assigneeId === null
            ? null
            : { id: card.assigneeId as string, name: card.assigneeName as string, email: card.assigneeEmail as string },
      })),
  }));

  res.json({
    id: board.id,
    teamId: board.team_id,
    name: board.name,
    createdAt: board.created_at,
    columns: withCards,
    team: { id: board.team_id, name: (req.db.prepare("SELECT name FROM teams WHERE id = ?").get(board.team_id) as { name: string }).name },
  });
});

boardsRouter.post("/:boardId/columns", (req, res, next) => {
  const board = req.db.prepare("SELECT team_id FROM boards WHERE id = ?").get(req.params.boardId) as
    | { team_id: string }
    | undefined;
  if (!board) return next(notFound("Board not found"));
  if (!teamRole(req.db, board.team_id, req.user!.id)) return next(forbidden("You are not a member of that team"));

  const parsed = columnBody.safeParse(req.body);
  if (!parsed.success) return next(unprocessable("Column name must be 1 to 80 characters"));

  const last = req.db
    .prepare("SELECT MAX(position) AS max FROM columns WHERE board_id = ?")
    .get(req.params.boardId) as { max: number | null };
  const id = newId();
  const position = (last.max ?? 0) + 1000;
  req.db
    .prepare("INSERT INTO columns (id, board_id, name, position) VALUES (?, ?, ?, ?)")
    .run(id, req.params.boardId, parsed.data.name, position);
  logActivity(req.db, req.params.boardId, req.user!.id, `added column "${parsed.data.name}"`);
  res.status(201).json({ id, boardId: req.params.boardId, name: parsed.data.name, position });
});

columnsRouter.patch("/:columnId", (req, res, next) => {
  const found = req.db
    .prepare(
      `SELECT c.id, b.team_id AS teamId, b.id AS boardId FROM columns c
       JOIN boards b ON b.id = c.board_id WHERE c.id = ?`,
    )
    .get(req.params.columnId) as { id: string; teamId: string; boardId: string } | undefined;
  if (!found) return next(notFound("Column not found"));
  if (!teamRole(req.db, found.teamId, req.user!.id)) return next(forbidden("You are not a member of that team"));

  const parsed = columnPatch.safeParse(req.body);
  if (!parsed.success) return next(unprocessable("Nothing to update"));

  if (parsed.data.name !== undefined) {
    req.db.prepare("UPDATE columns SET name = ? WHERE id = ?").run(parsed.data.name, found.id);
    logActivity(req.db, found.boardId, req.user!.id, `renamed a column to "${parsed.data.name}"`);
  }
  if (parsed.data.position !== undefined)
    req.db.prepare("UPDATE columns SET position = ? WHERE id = ?").run(parsed.data.position, found.id);

  const column = req.db
    .prepare("SELECT id, board_id AS boardId, name, position FROM columns WHERE id = ?")
    .get(found.id);
  res.json(column);
});
