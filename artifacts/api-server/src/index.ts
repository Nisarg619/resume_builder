import "dotenv/config";
import { validateEnv } from "./lib/env";
import { logger } from "./lib/logger";

// Validate environment before anything else
validateEnv();

import app from "./app";
import { pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port, env: process.env["NODE_ENV"] || "development" }, "Server listening");
});

// ── Graceful shutdown ───────────────────────────────────────────────
function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received, closing gracefully...");

  server.close(() => {
    logger.info("HTTP server closed");

    pool.end().then(() => {
      logger.info("Database pool closed");
      process.exit(0);
    }).catch((err) => {
      logger.error({ err }, "Error closing database pool");
      process.exit(1);
    });
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error("Graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Catch unhandled errors
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught Exception — shutting down");
  shutdown("uncaughtException");
});

