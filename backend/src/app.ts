import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { config } from "./config.js";
import { attachDb } from "./middleware/auth.js";
import { HttpError } from "./lib/errors.js";
import type { DB } from "./db/index.js";
import { authRouter } from "./routes/auth.js";
import { teamsRouter } from "./routes/teams.js";
import { boardsRouter, columnsRouter } from "./routes/boards.js";
import { cardsRouter } from "./routes/cards.js";

export function createApp(db: DB) {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin === "*" ? true : config.corsOrigin.split(",") }));
  app.use(express.json());
  app.use(morgan("dev"));
  app.use(attachDb(db));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRouter);
  app.use("/api/teams", teamsRouter);
  app.use("/api/boards", boardsRouter);
  app.use("/api/columns", columnsRouter);
  app.use("/api", cardsRouter);

  app.use((_req, res) => res.status(404).json({ error: { message: "Route not found" } }));

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: { message: err.message } });
    if (err instanceof ZodError) return res.status(422).json({ error: { message: err.issues[0].message } });
    console.error(err);
    res.status(500).json({ error: { message: "Internal server error" } });
  });

  return app;
}
