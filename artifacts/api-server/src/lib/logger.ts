import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  name: "resume-ai-api",
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
    "*.password",
    "*.secret",
    "*.token",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});

