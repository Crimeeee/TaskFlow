import { Router } from "express";
import { z } from "zod";
import { newId } from "../lib/id.js";
import { badRequest, forbidden, notFound, unprocessable } from "../lib/errors.js";
import { requireAuth, teamRole } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

const nullableId = z.string().min(1).nullable().optional();
const dueDate = z.string().min(4).max(40).nullable().optional();

const cardBody = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(4000).optional(),
  assigneeId: nullableId,
  dueDate,
});

const cardPatch = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
  position: z.number().optional(),
  columnId: nullableId,
  assigneeId: nullableId,
  dueDate,
});

type CardRow = {
  id: string;
  column_id: string;
  title: string;
  description: string;
  position: number;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
};

function loadCard(db: Express.Request["db"], id: string) {
  return db
    .prepare(
      `SELECT c.id, c.column_id, c.title, c.description, c.position, c.assignee_id, c.due_date, c.created_at,
              b.team_id AS teamId, b.id AS boardId
       FROM cards c JOIN columns col ON col.id = c.column_id JOIN boards b ON b.id = col.board_id
       WHERE c.id = ?`,
    )
    .get(id) as (CardRow & { teamId: string; boardId: string }) | undefined;
}

function shapeCard(db: Express.Request["db"], row: CardRow) {
  const assignee = row.assignee_id
    ? (db.prepare("SELECT id, name, email FROM users WHERE id = ?").get(row.assignee_id) as
        { id: string; name: string; email: string } | undefined)
    : undefined;
  return {
    id: row.id,
    columnId: row.column_id,
    title: row.title,
    description: row.description,
    position: row.position,
    dueDate: row.due_date,
    createdAt: row.created_at,
    assignee: assignee ?? null,
  };
}

function checkAssignee(db: Express.Request["db"], assigneeId: string | null | undefined, teamId: string) {
  if (!assigneeId) return;
  const isMember = db
    .prepare("SELECT 1 FROM memberships WHERE team_id = ? AND user_id = ?")
    .get(teamId, assigneeId);
  if (!isMember) throw badRequest("Assignee must be a member of the team");
}

function neighbourPosition(db: Express.Request["db"], columnId: string, excludeId: string | null) {
  const row = db
    .prepare("SELECT MAX(position) AS max FROM cards WHERE column_id = ? AND id != ?")
    .get(columnId, excludeId ?? "") as { max: number | null };
  return row.max === null ? null : row.max;
}

export const cardsRouter = Router();
cardsRouter.use(requireAuth);

cardsRouter.post("/columns/:columnId/cards", (req, res, next) => {
  const column = req.db
    .prepare(
      `SELECT c.id, b.team_id AS teamId, b.id AS boardId FROM columns c
       JOIN boards b ON b.id = c.board_id WHERE c.id = ?`,
    )
    .get(req.params.columnId) as { id: string; teamId: string; boardId: string } | undefined;
  if (!column) return next(notFound("Column not found"));
  if (!teamRole(req.db, column.teamId, req.user!.id)) return next(forbidden("You are not a member of that team"));

  const parsed = cardBody.safeParse(req.body);
  if (!parsed.success) return next(unprocessable(parsed.error.issues[0].message));

  try {
    checkAssignee(req.db, parsed.data.assigneeId, column.teamId);
  } catch (err) {
    return next(err);
  }

  const id = newId();
  const position = (neighbourPosition(req.db, column.id, null) ?? 0) + 1000;
  req.db
    .prepare(
      `INSERT INTO cards (id, column_id, title, description, position, assignee_id, due_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      column.id,
      parsed.data.title,
      parsed.data.description ?? "",
      position,
      parsed.data.assigneeId ?? null,
      parsed.data.dueDate ?? null,
    );
  logActivity(req.db, column.boardId, req.user!.id, `added card "${parsed.data.title}"`);
  res.status(201).json(shapeCard(req.db, loadCard(req.db, id)!));
});

cardsRouter.patch("/cards/:cardId", (req, res, next) => {
  const row = loadCard(req.db, req.params.cardId);
  if (!row) return next(notFound("Card not found"));
  if (!teamRole(req.db, row.teamId, req.user!.id)) return next(forbidden("You are not a member of that team"));

  const parsed = cardPatch.safeParse(req.body);
  if (!parsed.success) return next(unprocessable(parsed.error.issues[0].message));
  const body = parsed.data;
  if (Object.keys(body).length === 0) return next(unprocessable("Nothing to update"));

  try {
    checkAssignee(req.db, body.assigneeId, row.teamId);
  } catch (err) {
    return next(err);
  }

  if (body.columnId && body.columnId !== row.column_id) {
    const target = req.db
      .prepare(
        `SELECT c.id, b.id AS boardId FROM columns c JOIN boards b ON b.id = c.board_id WHERE c.id = ?`,
      )
      .get(body.columnId) as { id: string; boardId: string } | undefined;
    if (!target) return next(notFound("Target column not found"));
    if (target.boardId !== row.boardId) return next(badRequest("Cannot move a card to a column on another board"));
  }

  const targetColumn = body.columnId ?? undefined;
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  const push = (col: string, value: string | number | null) => {
    fields.push(`${col} = ?`);
    values.push(value);
  };
  if (body.title !== undefined) push("title", body.title);
  if (body.description !== undefined) push("description", body.description);
  if (body.assigneeId !== undefined) push("assignee_id", body.assigneeId);
  if (body.dueDate !== undefined) push("due_date", body.dueDate);
  if (body.columnId !== undefined) push("column_id", body.columnId);
  if (body.position !== undefined) push("position", body.position);
  else if (targetColumn !== undefined)
    push("position", (neighbourPosition(req.db, targetColumn, row.id) ?? 0) + 1000);
  push("updated_at", new Date().toISOString());

  values.push(row.id);
  req.db.prepare(`UPDATE cards SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  if (body.title !== undefined && body.title !== row.title)
    logActivity(req.db, row.boardId, req.user!.id, `renamed a card to "${body.title}"`);
  if (targetColumn !== undefined && targetColumn !== row.column_id) {
    const columnName = req.db.prepare("SELECT name FROM columns WHERE id = ?").get(targetColumn) as { name: string };
    logActivity(req.db, row.boardId, req.user!.id, `moved "${row.title}" to ${columnName.name}`);

  } else if (body.assigneeId !== undefined && body.assigneeId !== row.assignee_id)
    logActivity(req.db, row.boardId, req.user!.id, `updated "${row.title}"`);

  res.json(shapeCard(req.db, loadCard(req.db, row.id)!));
});

cardsRouter.delete("/cards/:cardId", (req, res, next) => {
  const row = loadCard(req.db, req.params.cardId);
  if (!row) return next(notFound("Card not found"));
  if (!teamRole(req.db, row.teamId, req.user!.id)) return next(forbidden("You are not a member of that team"));

  req.db.prepare("DELETE FROM cards WHERE id = ?").run(row.id);
  logActivity(req.db, row.boardId, req.user!.id, `deleted card "${row.title}"`);
  res.json({ ok: true });
});

cardsRouter.get("/boards/:boardId/activity", (req, res, next) => {
  const board = req.db.prepare("SELECT team_id FROM boards WHERE id = ?").get(req.params.boardId) as
    | { team_id: string }
    | undefined;
  if (!board) return next(notFound("Board not found"));
  if (!teamRole(req.db, board.team_id, req.user!.id)) return next(forbidden("You are not a member of that team"));

  const rows = req.db
    .prepare(
      `SELECT a.id, a.board_id AS boardId, a.message, a.created_at AS createdAt, u.name AS userName
       FROM activity a LEFT JOIN users u ON u.id = a.user_id
       WHERE a.board_id = ? ORDER BY a.created_at DESC, a.rowid DESC LIMIT 50`,
    )
    .all(req.params.boardId);
  res.json(rows);
});
