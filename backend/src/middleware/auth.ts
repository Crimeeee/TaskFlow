import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { unauthorized } from "../lib/errors.js";
import type { DB } from "../db/index.js";
import type { PublicUser, Role } from "../types.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: PublicUser;
      db: DB;
    }
  }
}

export function attachDb(db: DB) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.db = db;
    next();
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(unauthorized());
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    const row = req.db
      .prepare("SELECT id, name, email FROM users WHERE id = ?")
      .get(payload.sub) as PublicUser | undefined;
    if (!row) return next(unauthorized("User no longer exists"));
    req.user = row;
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}

export function teamRole(db: DB, teamId: string, userId: string): Role | null {
  const row = db
    .prepare("SELECT role FROM memberships WHERE team_id = ? AND user_id = ?")
    .get(teamId, userId) as { role: Role } | undefined;
  return row?.role ?? null;
}

export function boardOfTeam(db: DB, boardId: string) {
  return db.prepare("SELECT id, team_id, name, created_at FROM boards WHERE id = ?").get(boardId) as
    | { id: string; team_id: string; name: string; created_at: string }
    | undefined;
}
