import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { resumesTable, usersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/resumes", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const resumes = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, req.userId!))
      .orderBy(resumesTable.updatedAt);

    res.json(
      resumes.reverse().map((r) => ({
        id: r.id,
        userId: r.userId,
        title: r.title,
        data: r.data,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "List resumes error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resumes", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { title, data } = req.body as { title: string; data: unknown };

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [resume] = await db
      .insert(resumesTable)
      .values({ userId: req.userId!, title, data: data as Record<string, unknown> })
      .returning();

    await db
      .update(usersTable)
      .set({ usageResumeCount: user.usageResumeCount + 1, updatedAt: new Date() })
      .where(eq(usersTable.id, req.userId!));

    res.status(201).json({
      id: resume!.id,
      userId: resume!.userId,
      title: resume!.title,
      data: resume!.data,
      createdAt: resume!.createdAt.toISOString(),
      updatedAt: resume!.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Create resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/resumes/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  try {
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId!)));

    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    res.json({
      id: resume.id,
      userId: resume.userId,
      title: resume.title,
      data: resume.data,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/resumes/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  const { title, data } = req.body as { title: string; data: unknown };

  try {
    const [resume] = await db
      .update(resumesTable)
      .set({ title, data: data as Record<string, unknown>, updatedAt: new Date() })
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId!)))
      .returning();

    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    res.json({
      id: resume.id,
      userId: resume.userId,
      title: resume.title,
      data: resume.data,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/resumes/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const id = req.params["id"] as string;
  try {
    await db
      .delete(resumesTable)
      .where(and(eq(resumesTable.id, id), eq(resumesTable.userId, req.userId!)));

    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Delete resume error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
