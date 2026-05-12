import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { resumesTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc, sql } from "@workspace/db";
import {
  success, created, noContent, badRequest, notFound, forbidden, serverError,
  requireFields, serializeResume,
} from "../lib/responses.js";

const router = Router();

router.get("/resumes", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const resumes = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.user.id))
      .orderBy(desc(resumesTable.updatedAt));

    success(res, resumes.map(serializeResume));
  } catch (err) {
    req.log.error({ err }, "List resumes error");
    serverError(res);
  }
});

router.post("/resumes", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{ title: string; data: unknown }>(req.body, ["title", "data"]);
  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }
  const { title, data } = check.data;

  try {
    // Quota Check for Free users
    if (req.user.plan === "free") {
      const [user] = await db.select({ usageResumeCount: usersTable.usageResumeCount }).from(usersTable).where(eq(usersTable.id, req.user.id));
      if (user && user.usageResumeCount >= 3) {
        forbidden(res, "Resume limit reached. Upgrade to Pro for unlimited resumes.", "LIMIT_REACHED");
        return;
      }
    }

    const [resume] = await db
      .insert(resumesTable)
      .values({ userId: req.user.id, title: (title || "Untitled Resume").trim(), data: data as Record<string, unknown> })
      .returning();

    // Increment usage count atomically
    await db
      .update(usersTable)
      .set({ 
        usageResumeCount: sql`${usersTable.usageResumeCount} + 1`, 
        updatedAt: new Date() 
      })
      .where(eq(usersTable.id, req.user.id));

    created(res, serializeResume(resume!));
  } catch (err) {
    req.log.error({ err }, "Create resume error");
    serverError(res);
  }
});

router.get("/resumes/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  try {
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.user.id)));

    if (!resume) { notFound(res, "Resume"); return; }

    success(res, serializeResume(resume));
  } catch (err) {
    req.log.error({ err }, "Get resume error");
    serverError(res);
  }
});

router.put("/resumes/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  const { title, data } = (req.body ?? {}) as { title?: string; data?: unknown };

  if (!title && !data) {
    badRequest(res, "At least one of title or data must be provided");
    return;
  }

  try {
    const updateSet: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateSet.title = title;
    if (data !== undefined) updateSet.data = data as Record<string, unknown>;

    const [resume] = await db
      .update(resumesTable)
      .set(updateSet)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.user.id)))
      .returning();

    if (!resume) { notFound(res, "Resume"); return; }

    success(res, serializeResume(resume));
  } catch (err) {
    req.log.error({ err }, "Update resume error");
    serverError(res);
  }
});

router.delete("/resumes/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  try {
    const result = await db
      .delete(resumesTable)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.user.id)));

    noContent(res);
  } catch (err) {
    req.log.error({ err }, "Delete resume error");
    serverError(res);
  }
});

export default router;
