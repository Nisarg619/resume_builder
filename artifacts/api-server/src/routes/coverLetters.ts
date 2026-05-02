import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { coverLettersTable, usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/cover-letters", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const letters = await db
      .select()
      .from(coverLettersTable)
      .where(eq(coverLettersTable.userId, req.userId!))
      .orderBy(coverLettersTable.updatedAt);

    res.json(
      letters.reverse().map((l) => ({
        id: l.id,
        userId: l.userId,
        title: l.title,
        jobTitle: l.jobTitle,
        companyName: l.companyName,
        content: l.content,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "List cover letters error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cover-letters", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { title, jobTitle, companyName, content } = req.body as {
    title: string;
    jobTitle?: string;
    companyName?: string;
    content: string;
  };

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [letter] = await db
      .insert(coverLettersTable)
      .values({ userId: req.userId!, title, jobTitle, companyName, content })
      .returning();

    await db
      .update(usersTable)
      .set({ usageCoverLetterCount: user.usageCoverLetterCount + 1, updatedAt: new Date() })
      .where(eq(usersTable.id, req.userId!));

    res.status(201).json({
      id: letter!.id,
      userId: letter!.userId,
      title: letter!.title,
      jobTitle: letter!.jobTitle,
      companyName: letter!.companyName,
      content: letter!.content,
      createdAt: letter!.createdAt.toISOString(),
      updatedAt: letter!.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create cover letter error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/cover-letters/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  try {
    const [letter] = await db
      .select()
      .from(coverLettersTable)
      .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, req.userId!)));

    if (!letter) {
      res.status(404).json({ error: "Cover letter not found" });
      return;
    }

    res.json({
      id: letter.id,
      userId: letter.userId,
      title: letter.title,
      jobTitle: letter.jobTitle,
      companyName: letter.companyName,
      content: letter.content,
      createdAt: letter.createdAt.toISOString(),
      updatedAt: letter.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get cover letter error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/cover-letters/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  const { title, content } = req.body as { title?: string; content?: string };

  try {
    const [letter] = await db
      .update(coverLettersTable)
      .set({ title, content, updatedAt: new Date() })
      .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, req.userId!)))
      .returning();

    if (!letter) {
      res.status(404).json({ error: "Cover letter not found" });
      return;
    }

    res.json({
      id: letter.id,
      userId: letter.userId,
      title: letter.title,
      jobTitle: letter.jobTitle,
      companyName: letter.companyName,
      content: letter.content,
      createdAt: letter.createdAt.toISOString(),
      updatedAt: letter.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update cover letter error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cover-letters/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  try {
    await db
      .delete(coverLettersTable)
      .where(and(eq(coverLettersTable.id, id), eq(coverLettersTable.userId, req.userId!)));

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete cover letter error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
