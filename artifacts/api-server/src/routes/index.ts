import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import resumesRouter from "./resumes.js";
import coverLettersRouter from "./coverLetters.js";
import aiRouter from "./ai.js";
import paymentsRouter from "./payments.js";

const router: IRouter = Router();

// AI routes get a stricter rate limit (15 req/min) since they're expensive
const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI rate limit exceeded. Please wait a moment." },
});

// Auth gets its own limiter to prevent brute force (10 req/min)
const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Please wait." },
});

router.use(healthRouter);
router.use(authLimiter, authRouter);
router.use(usersRouter);
router.use(resumesRouter);
router.use(coverLettersRouter);
router.use(aiLimiter, aiRouter);
router.use(paymentsRouter);

export default router;
