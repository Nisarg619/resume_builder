import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middlewares/auth.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "@workspace/db";
import { success, badRequest, notFound, serverError, serializeUser } from "../lib/responses.js";

const router = Router();

router.get("/users/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id));

    if (!user) { notFound(res, "User"); return; }

    success(res, serializeUser(user));
  } catch (err) {
    req.log.error({ err }, "Get user error");
    serverError(res);
  }
});

router.patch("/users/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { name, avatarUrl } = (req.body ?? {}) as { name?: string; avatarUrl?: string };

  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
    badRequest(res, "Name must be a non-empty string if provided");
    return;
  }

  try {
    const updateSet: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateSet.name = name.trim();
    if (avatarUrl !== undefined) updateSet.avatarUrl = avatarUrl;

    const [updated] = await db
      .update(usersTable)
      .set(updateSet)
      .where(eq(usersTable.id, req.user.id))
      .returning();

    if (!updated) { notFound(res, "User"); return; }

    success(res, serializeUser(updated));
  } catch (err) {
    req.log.error({ err }, "Update user error");
    serverError(res);
  }
});

export default router;
