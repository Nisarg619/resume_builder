import { Router } from "express";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "@workspace/db";
import { success, badRequest, serverError, serializeUser, unauthorized } from "../lib/responses.js";

const router = Router();

router.post("/auth/verify", async (req, res) => {
  const { token } = req.body as { token: string };

  if (!isSupabaseConfigured || !supabase) {
    res.status(503).json({
      error:
        "Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY).",
    });
    return;
  }

  if (!token) {
    badRequest(res, "Token required");
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      unauthorized(res, "Invalid token");
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
      dbUser = inserted!;
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

    success(res, serializeUser(dbUser));
  } catch (err) {
    req.log.error({ err }, "Auth verify error");
    serverError(res);
  }
});

export default router;
