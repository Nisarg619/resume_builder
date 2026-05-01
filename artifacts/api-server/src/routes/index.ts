import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import resumesRouter from "./resumes.js";
import coverLettersRouter from "./coverLetters.js";
import aiRouter from "./ai.js";
import paymentsRouter from "./payments.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(resumesRouter);
router.use(coverLettersRouter);
router.use(aiRouter);
router.use(paymentsRouter);

export default router;
