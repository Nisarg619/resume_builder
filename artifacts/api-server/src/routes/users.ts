import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/users/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      plan: user.plan,
      usageResumeCount: user.usageResumeCount,
      usageCoverLetterCount: user.usageCoverLetterCount,
      subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { name, avatarUrl } = req.body as { name?: string; avatarUrl?: string };

  try {
    const [updated] = await db
      .update(usersTable)
      .set({ name, avatarUrl, updatedAt: new Date() })
      .where(eq(usersTable.id, req.userId!))
      .returning();

    res.json({
      id: updated!.id,
      email: updated!.email,
      name: updated!.name,
      avatarUrl: updated!.avatarUrl,
      plan: updated!.plan,
      usageResumeCount: updated!.usageResumeCount,
      usageCoverLetterCount: updated!.usageCoverLetterCount,
      subscriptionExpiresAt: updated!.subscriptionExpiresAt?.toISOString() ?? null,
      createdAt: updated!.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Update user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
