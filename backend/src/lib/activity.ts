import { newId } from "./id.js";
import type { DB } from "../db/index.js";

export function logActivity(db: DB, boardId: string, userId: string, message: string) {
  db.prepare("INSERT INTO activity (id, board_id, user_id, message) VALUES (?, ?, ?, ?)").run(
    newId(),
    boardId,
    userId,
    message,
  );
}
