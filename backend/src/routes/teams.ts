import { Router } from "express";
import { z } from "zod";
import { newId } from "../lib/id.js";
import { badRequest, forbidden, notFound, unprocessable } from "../lib/errors.js";
import { requireAuth, teamRole } from "../middleware/auth.js";
import type { Role } from "../types.js";

const nameSchema = z.string().trim().min(1).max(80);
const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

const canManage = (role: Role | null) => role === "OWNER" || role === "ADMIN";

export const teamsRouter = Router();
teamsRouter.use(requireAuth);

teamsRouter.post("/", (req, res, next) => {
  const parsed = nameSchema.safeParse(req.body?.name);
  if (!parsed.success) return next(unprocessable("Team name must be 1 to 80 characters"));

  const id = newId();
  req.db.prepare("INSERT INTO teams (id, name) VALUES (?, ?)").run(id, parsed.data);
  req.db
    .prepare("INSERT INTO memberships (team_id, user_id, role) VALUES (?, ?, 'OWNER')")
    .run(id, req.user!.id);
  res.status(201).json({ id, name: parsed.data, role: "OWNER" });
});

teamsRouter.get("/", (req, res) => {
  const rows = req.db
    .prepare(
      `SELECT t.id, t.name, m.role
       FROM teams t JOIN memberships m ON m.team_id = t.id
       WHERE m.user_id = ? ORDER BY t.name`,
    )
    .all(req.user!.id) as { id: string; name: string; role: Role }[];
  res.json(rows);
});

teamsRouter.get("/:teamId/members", (req, res, next) => {
  const role = teamRole(req.db, req.params.teamId, req.user!.id);
  if (!role) return next(notFound("Team not found"));
  const members = req.db
    .prepare(
      `SELECT u.id, u.name, u.email, m.role
       FROM memberships m JOIN users u ON u.id = m.user_id
       WHERE m.team_id = ? ORDER BY m.role, u.name`,
    )
    .all(req.params.teamId);
  res.json(members);
});

teamsRouter.post("/:teamId/members", (req, res, next) => {
  const parsed = inviteSchema.safeParse(req.body);
  if (!parsed.success) return next(unprocessable("Provide a valid email and role"));

  const role = teamRole(req.db, req.params.teamId, req.user!.id);
  if (!role) return next(notFound("Team not found"));
  if (!canManage(role)) return next(forbidden("Only the owner or admins can invite members"));

  const invitee = req.db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(parsed.data.email.toLowerCase()) as { id: string } | undefined;
  if (!invitee) return next(badRequest("No user with that email exists"));

  const already = req.db
    .prepare("SELECT 1 FROM memberships WHERE team_id = ? AND user_id = ?")
    .get(req.params.teamId, invitee.id);
  if (already) return next(badRequest("That user is already a member of this team"));

  req.db
    .prepare("INSERT INTO memberships (team_id, user_id, role) VALUES (?, ?, ?)")
    .run(req.params.teamId, invitee.id, parsed.data.role);

  const member = req.db
    .prepare(
      `SELECT u.id, u.name, u.email, m.role
       FROM memberships m JOIN users u ON u.id = m.user_id
       WHERE m.team_id = ? AND m.user_id = ?`,
    )
    .get(req.params.teamId, invitee.id);
  res.status(201).json(member);
});
