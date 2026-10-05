export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  dbFile: process.env.DATABASE_FILE ?? "./data/taskflow.db",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
