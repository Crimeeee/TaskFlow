import { describe, it, expect, beforeEach, afterAll } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { openDb, type DB } from "../src/db/index.js";
import { createApp } from "../src/app.js";

let db: DB;
let app: Express;

beforeEach(() => {
  db = openDb(":memory:");
  app = createApp(db);
});

afterAll(() => db.close());

async function signUp(email = "a@test.dev", name = "Ana") {
  const res = await request(app).post("/api/auth/register").send({ name, email, password: "password123" });
  return res.body as { user: { id: string }; accessToken: string };
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

async function seedBoard() {
  const owner = await signUp("owner@test.dev", "Owner");
  const { body: team } = await request(app).post("/api/teams").set(auth(owner.accessToken)).send({ name: "Team A" });
  const { body: board } = await request(app)
    .post("/api/boards")
    .set(auth(owner.accessToken))
    .send({ teamId: team.id, name: "Board A" });
  const { body: detail } = await request(app).get(`/api/boards/${board.id}`).set(auth(owner.accessToken));
  return { owner, team, board, detail };
}

describe("health", () => {
  it("reports ok", async () => {
    await request(app).get("/api/health").expect(200, { status: "ok" });
  });
});

describe("auth", () => {
  it("registers and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "Ana", email: "a@test.dev", password: "password123" });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTypeOf("string");
    expect(res.body.user).not.toHaveProperty("password_hash");
  });

  it("rejects a duplicate email with 409", async () => {
    await signUp("dup@test.dev");
    const res = await request(app).post("/api/auth/register").send({ name: "B", email: "dup@test.dev", password: "password123" });
    expect(res.status).toBe(409);
  });

  it("rejects a short password with 422", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "B", email: "b@test.dev", password: "short" });
    expect(res.status).toBe(422);
    expect(res.body.error.message).toBeTypeOf("string");
  });

  it("logs in with the right password and fails with the wrong one", async () => {
    await signUp("c@test.dev");
    await request(app).post("/api/auth/login").send({ email: "c@test.dev", password: "password123" }).expect(200);
    const bad = await request(app).post("/api/auth/login").send({ email: "c@test.dev", password: "wrongpassword" });
    expect(bad.status).toBe(401);
  });

  it("stores a bcrypt hash, not the password", async () => {
    await signUp("d@test.dev");
    const row = db.prepare("SELECT password_hash FROM users WHERE email = ?").get("d@test.dev") as { password_hash: string };
    expect(row.password_hash).not.toContain("password123");
    expect(row.password_hash.startsWith("$2")).toBe(true);
  });

  it("blocks protected routes without a token", async () => {
    await request(app).get("/api/auth/me").expect(401);
    await request(app).get("/api/teams").expect(401);
  });

  it("blocks a forged token", async () => {
    await request(app).get("/api/auth/me").set(auth("not.a.jwt")).expect(401);
  });

  it("returns the current user from /me", async () => {
    const u = await signUp("e@test.dev", "Eva");
    const res = await request(app).get("/api/auth/me").set(auth(u.accessToken));
    expect(res.body.email).toBe("e@test.dev");
  });
});

describe("teams and permissions", () => {
  it("makes the creator OWNER and lists the team", async () => {
    const { owner, team } = await seedBoard();
    expect(team.role).toBe("OWNER");
    const res = await request(app).get("/api/teams").set(auth(owner.accessToken));
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Team A");
  });

  it("does not list teams for outsiders", async () => {
    const { team } = await seedBoard();
    const outsider = await signUp("out@test.dev");
    const res = await request(app).get("/api/teams").set(auth(outsider.accessToken));
    expect(res.body).toEqual([]);
    await request(app).get(`/api/teams/${team.id}/members`).set(auth(outsider.accessToken)).expect(404);
  });

  it("lets an admin invite a member and rejects unknown emails", async () => {
    const { owner, team } = await seedBoard();
    const guest = await signUp("guest@test.dev");
    const res = await request(app)
      .post(`/api/teams/${team.id}/members`)
      .set(auth(owner.accessToken))
      .send({ email: "guest@test.dev", role: "MEMBER" });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("guest@test.dev");

    const missing = await request(app)
      .post(`/api/teams/${team.id}/members`)
      .set(auth(owner.accessToken))
      .send({ email: "nobody@test.dev" });
    expect(missing.status).toBe(400);
    expect(guest.accessToken).toBeTypeOf("string");
  });

  it("stops a plain member from inviting", async () => {
    const { owner, team } = await seedBoard();
    const plain = await signUp("plain@test.dev");
    await request(app).post(`/api/teams/${team.id}/members`).set(auth(owner.accessToken)).send({ email: "plain@test.dev" });
    await signUp("third@test.dev");
    const res = await request(app)
      .post(`/api/teams/${team.id}/members`)
      .set(auth(plain.accessToken))
      .send({ email: "third@test.dev" });
    expect(res.status).toBe(403);
  });

  it("forbids creating a board for a team you do not belong to", async () => {
    const { team } = await seedBoard();
    const outsider = await signUp("out2@test.dev");
    const res = await request(app).post("/api/boards").set(auth(outsider.accessToken)).send({ teamId: team.id, name: "X" });
    expect(res.status).toBe(403);
  });
});

describe("boards, columns and cards", () => {
  it("creates a board with four default columns", async () => {
    const { owner, board, detail } = await seedBoard();
    expect(board.name).toBe("Board A");
    expect(detail.columns).toHaveLength(4);
    expect(detail.columns[0].name).toBe("To do");
    expect(detail.team.name).toBe("Team A");
    await request(app).get(`/api/boards/${board.id}`).set(auth(owner.accessToken)).expect(200);
  });

  it("creates, edits and deletes a card", async () => {
    const { owner, detail } = await seedBoard();
    const columnId = detail.columns[0].id;

    const created = await request(app)
      .post(`/api/columns/${columnId}/cards`)
      .set(auth(owner.accessToken))
      .send({ title: "Write tests", description: "cover auth" });
    expect(created.status).toBe(201);
    expect(created.body.title).toBe("Write tests");
    expect(created.body.assignee).toBeNull();

    const patched = await request(app)
      .patch(`/api/cards/${created.body.id}`)
      .set(auth(owner.accessToken))
      .send({ title: "Write more tests" });
    expect(patched.body.title).toBe("Write more tests");

    await request(app).delete(`/api/cards/${created.body.id}`).set(auth(owner.accessToken)).expect(200, { ok: true });
    await request(app).patch(`/api/cards/${created.body.id}`).set(auth(owner.accessToken)).send({ title: "x" }).expect(404);
  });

  it("rejects an empty card title", async () => {
    const { owner, detail } = await seedBoard();
    const res = await request(app)
      .post(`/api/columns/${detail.columns[0].id}/cards`)
      .set(auth(owner.accessToken))
      .send({ title: "   " });
    expect(res.status).toBe(422);
  });

  it("assigns a card to a team member", async () => {
    const { owner, team, detail } = await seedBoard();
    const member = await signUp("assign@test.dev", "Bob");
    await request(app).post(`/api/teams/${team.id}/members`).set(auth(owner.accessToken)).send({ email: "assign@test.dev" });

    const res = await request(app)
      .post(`/api/columns/${detail.columns[0].id}/cards`)
      .set(auth(owner.accessToken))
      .send({ title: "Pair with Bob", assigneeId: member.user.id });
    expect(res.body.assignee.name).toBe("Bob");
  });

  it("rejects an assignee who is not in the team", async () => {
    const { owner, detail } = await seedBoard();
    const stranger = await signUp("stranger@test.dev");
    const res = await request(app)
      .post(`/api/columns/${detail.columns[0].id}/cards`)
      .set(auth(owner.accessToken))
      .send({ title: "Bad assign", assigneeId: stranger.user.id });
    expect(res.status).toBe(400);
  });

  it("moves a card to another column and keeps position", async () => {
    const { owner, detail } = await seedBoard();
    const from = detail.columns[0].id;
    const to = detail.columns[2].id;

    const created = await request(app).post(`/api/columns/${from}/cards`).set(auth(owner.accessToken)).send({ title: "Moving" });
    const moved = await request(app)
      .patch(`/api/cards/${created.body.id}`)
      .set(auth(owner.accessToken))
      .send({ columnId: to, position: 1500 });
    expect(moved.body.columnId).toBe(to);
    expect(moved.body.position).toBe(1500);

    const { body: after } = await request(app).get(`/api/boards/${detail.id}`).set(auth(owner.accessToken));
    const target = after.columns.find((c: { id: string }) => c.id === to);
    expect(target.cards.map((c: { id: string }) => c.id)).toContain(created.body.id);
    expect(after.columns.find((c: { id: string }) => c.id === from).cards).toHaveLength(0);
  });

  it("refuses to move a card to a column on another board", async () => {
    const { owner, team, detail } = await seedBoard();
    const other = await request(app)
      .post("/api/boards")
      .set(auth(owner.accessToken))
      .send({ teamId: team.id, name: "Board B" });
    const { body: otherDetail } = await request(app).get(`/api/boards/${other.body.id}`).set(auth(owner.accessToken));

    const created = await request(app).post(`/api/columns/${detail.columns[0].id}/cards`).set(auth(owner.accessToken)).send({ title: "Stuck" });
    const res = await request(app)
      .patch(`/api/cards/${created.body.id}`)
      .set(auth(owner.accessToken))
      .send({ columnId: otherDetail.columns[0].id });
    expect(res.status).toBe(400);
  });

  it("keeps cards ordered by position", async () => {
    const { owner, detail } = await seedBoard();
    const columnId = detail.columns[0].id;
    const a = await request(app).post(`/api/columns/${columnId}/cards`).set(auth(owner.accessToken)).send({ title: "A" });
    const b = await request(app).post(`/api/columns/${columnId}/cards`).set(auth(owner.accessToken)).send({ title: "B" });
    await request(app).patch(`/api/cards/${a.body.id}`).set(auth(owner.accessToken)).send({ position: 5000 });

    const { body: after } = await request(app).get(`/api/boards/${detail.id}`).set(auth(owner.accessToken));
    const order = after.columns.find((c: { id: string }) => c.id === columnId).cards.map((c: { id: string }) => c.id);
    expect(order).toEqual([b.body.id, a.body.id]);
  });

  it("renames a column", async () => {
    const { owner, detail } = await seedBoard();
    const res = await request(app)
      .patch(`/api/columns/${detail.columns[0].id}`)
      .set(auth(owner.accessToken))
      .send({ name: "Backlog" });
    expect(res.body.name).toBe("Backlog");
  });

  it("forbids an outsider from reading the board", async () => {
    const { board } = await seedBoard();
    const outsider = await signUp("out3@test.dev");
    await request(app).get(`/api/boards/${board.id}`).set(auth(outsider.accessToken)).expect(403);
  });

  it("returns 404 for an unknown board", async () => {
    const { owner } = await seedBoard();
    await request(app).get("/api/boards/nope").set(auth(owner.accessToken)).expect(404);
  });
});

describe("activity feed", () => {
  it("records card and column events newest first", async () => {
    const { owner, detail } = await seedBoard();
    const columnId = detail.columns[0].id;
    const card = await request(app).post(`/api/columns/${columnId}/cards`).set(auth(owner.accessToken)).send({ title: "Tracked" });
    await request(app).delete(`/api/cards/${card.body.id}`).set(auth(owner.accessToken));

    const res = await request(app).get(`/api/boards/${detail.id}/activity`).set(auth(owner.accessToken));
    expect(res.status).toBe(200);
    const messages: string[] = res.body.map((a: { message: string }) => a.message);
    expect(messages[0]).toContain("deleted card");
    expect(messages).toContain('added card "Tracked"');
  });
});
