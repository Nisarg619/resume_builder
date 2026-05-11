import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import crypto from "node:crypto";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { globalErrorHandler } from "./lib/responses.js";

const isProduction = process.env["NODE_ENV"] === "production";
const app: Express = express();

// ── Request ID for traceability ─────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  (req as any).id = req.headers["x-request-id"] || crypto.randomUUID();
  next();
});

// ── Structured request logging ──────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => (req as any).id,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Security headers ────────────────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0"); // Modern browsers: CSP is preferred
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.removeHeader("X-Powered-By");

  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    res.setHeader("Content-Security-Policy", "default-src 'self'");
  }

  next();
});

// ── CORS ────────────────────────────────────────────────────────────
const allowedOrigins = process.env["CORS_ORIGINS"]?.split(",").map((o) => o.trim()).filter(Boolean) || [];
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) {
        cb(null, true);
        return;
      }
      // In development, allow everything
      if (!isProduction || allowedOrigins.includes("*")) {
        cb(null, true);
        return;
      }
      // In production, enforce the allowlist
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  }),
);

// ── Body parsing with size limits ───────────────────────────────────
app.use(express.json({ 
  limit: "2mb",
  verify: (req: any, _res, buf) => {
    if (req.url?.includes("/api/payments/webhook")) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ── Global rate limiter (100 req/min per IP) ────────────────────────
app.use(
  rateLimit({
    windowMs: 60_000,
    max: isProduction ? 100 : 1000, // Generous in dev
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  }),
);

// ── Routes ──────────────────────────────────────────────────────────
app.use("/api", router);

// ── 404 catch-all ───────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ── Global error handler (must be after routes) ─────────────────────
app.use(globalErrorHandler);

export default app;

