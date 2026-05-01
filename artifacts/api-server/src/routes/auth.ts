import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/auth/verify", async (req, res) => {
  const { token } = req.body as { token: string };

  if (!token) {
    res.status(400).json({ error: "Token required" });
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    let dbUser;
    if (existing.length === 0) {
      const [inserted] = await db
        .insert(usersTable)
        .values({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.["full_name"] || user.user_metadata?.["name"] || null,
          avatarUrl: user.user_metadata?.["avatar_url"] || null,
          plan: "free",
          usageResumeCount: 0,
          usageCoverLetterCount: 0,
          usageResetDate: firstOfMonth,
        })
        .returning();
      dbUser = inserted;
    } else {
      dbUser = existing[0]!;
      if (dbUser.usageResetDate && dbUser.usageResetDate < firstOfMonth) {
        const [updated] = await db
          .update(usersTable)
          .set({ usageResumeCount: 0, usageCoverLetterCount: 0, usageResetDate: firstOfMonth })
          .where(eq(usersTable.id, user.id))
          .returning();
        dbUser = updated!;
      }
    }

    res.json({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
      plan: dbUser.plan,
      usageResumeCount: dbUser.usageResumeCount,
      usageCoverLetterCount: dbUser.usageCoverLetterCount,
      subscriptionExpiresAt: dbUser.subscriptionExpiresAt?.toISOString() ?? null,
      createdAt: dbUser.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Auth verify error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
