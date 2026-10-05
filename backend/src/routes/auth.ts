import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config.js";
import { newId } from "../lib/id.js";
import { conflict, unauthorized, unprocessable } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import type { PublicUser } from "../types.js";

const credentials = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
});

const registerBody = credentials.extend({ name: z.string().min(1).max(120) });

const issueToken = (id: string) => jwt.sign({ sub: id }, config.jwtSecret, { expiresIn: "7d" });

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const parsed = registerBody.safeParse(req.body);
    if (!parsed.success) return next(unprocessable(parsed.error.issues[0].message));
    const email = parsed.data.email.toLowerCase();

    if (req.db.prepare("SELECT id FROM users WHERE email = ?").get(email))
      return next(conflict("An account with this email already exists"));

    const user: PublicUser = { id: newId(), name: parsed.data.name.trim(), email };
    const hash = await bcrypt.hash(parsed.data.password, 10);
    req.db
      .prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)")
      .run(user.id, user.name, user.email, hash);

    res.status(201).json({ user, accessToken: issueToken(user.id) });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return next(unprocessable(parsed.error.issues[0].message));
    const email = parsed.data.email.toLowerCase();

    const row = req.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
      | (PublicUser & { password_hash: string })
      | undefined;
    const ok = row ? await bcrypt.compare(parsed.data.password, row.password_hash) : false;
    if (!row || !ok) return next(unauthorized("Invalid email or password"));

    const user: PublicUser = { id: row.id, name: row.name, email: row.email };
    res.json({ user, accessToken: issueToken(user.id) });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});
