import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { coverLettersTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc } from "@workspace/db";
import {
  success, created, noContent, badRequest, notFound, forbidden, serverError,
  requireFields, serializeCoverLetter,
} from "../lib/responses.js";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/cover-letters", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const letters = await db
      .select()
      .from(coverLettersTable)
      .where(eq(coverLettersTable.userId, req.user.id))
      .orderBy(desc(coverLettersTable.updatedAt));

    success(res, letters.map(serializeCoverLetter));
  } catch (err) {
    req.log.error({ err }, "List cover letters error");
    serverError(res);
  }
});

router.post("/cover-letters", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const check = requireFields<{ title: string; content: string; jobTitle?: string; companyName?: string }>(req.body, ["title", "content"]);
  if (!check.valid) {
    badRequest(res, `Missing required fields: ${check.missing.join(", ")}`);
    return;
  }
  const { title, content, jobTitle, companyName } = check.data;

  try {
    // Quota Check
    if (req.user.plan === "free") {
      const [user] = await db.select({ usageCoverLetterCount: usersTable.usageCoverLetterCount }).from(usersTable).where(eq(usersTable.id, req.user.id));
      if (user && user.usageCoverLetterCount >= 3) {
        forbidden(res, "Cover letter limit reached. Upgrade to Pro for unlimited generation.", "LIMIT_REACHED");
        return;
      }
    }

    const [letter] = await db
      .insert(coverLettersTable)
      .values({ 
        userId: req.user.id, 
        title: title.trim(), 
        jobTitle: jobTitle?.trim() ?? null, 
        companyName: companyName?.trim() ?? null, 
        content: content.trim() 
      })
      .returning();

    await db
      .update(usersTable)
      .set({ 
        usageCoverLetterCount: sql`${usersTable.usageCoverLetterCount} + 1`, 
        updatedAt: new Date() 
      })
      .where(eq(usersTable.id, req.user.id));

    created(res, serializeCoverLetter(letter!));
  } catch (err) {
    req.log.error({ err }, "Create cover letter error");
    serverError(res);
  }
});

router.get("/cover-letters/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  try {
    const [letter] = await db
      .select()
      .from(coverLettersTable)
      .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, req.user.id)));

    if (!letter) { notFound(res, "Cover letter"); return; }

    success(res, serializeCoverLetter(letter));
  } catch (err) {
    req.log.error({ err }, "Get cover letter error");
    serverError(res);
  }
});

router.put("/cover-letters/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  const { title, content } = (req.body ?? {}) as { title?: string; content?: string };

  if (!title && !content) {
    badRequest(res, "At least one of title or content must be provided");
    return;
  }

  try {
    const updateSet: Record<string, unknown> = { updatedAt: new Date() };
    if (title !== undefined) updateSet.title = title;
    if (content !== undefined) updateSet.content = content;

    const [letter] = await db
      .update(coverLettersTable)
      .set(updateSet)
      .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, req.user.id)))
      .returning();

    if (!letter) { notFound(res, "Cover letter"); return; }

    success(res, serializeCoverLetter(letter));
  } catch (err) {
    req.log.error({ err }, "Update cover letter error");
    serverError(res);
  }
});

router.delete("/cover-letters/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  try {
    await db
      .delete(coverLettersTable)
      .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, req.user.id)));

    noContent(res);
  } catch (err) {
    req.log.error({ err }, "Delete cover letter error");
    serverError(res);
  }
});

export default router;
