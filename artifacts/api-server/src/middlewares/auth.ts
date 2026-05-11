import type { Request, Response, NextFunction } from "express";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "@workspace/db";
import { unauthorized, forbidden } from "../lib/responses.js";

export interface AuthenticatedRequest extends Request {
  user: { id: string; plan: "free" | "pro" };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Block dev bypass in production
  if (process.env["DEV_BYPASS_AUTH"] === "true" && process.env["NODE_ENV"] !== "production") {
    req.user = { id: "dev-user", plan: "pro" };
    next();
    return;
  }

  if (!isSupabaseConfigured || !supabase) {
    res.status(503).json({
      error:
        "Auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY), or set DEV_BYPASS_AUTH=true for local dev.",
    });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    unauthorized(res, "Missing authorization header");
    return;
  }

  const token = authHeader.slice(7);
  if (!token || token.length < 10) {
    unauthorized(res, "Invalid token format");
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      unauthorized(res, "Invalid or expired token");
      return;
    }

    const [dbUser] = await db
      .select({ 
        id: usersTable.id, 
        plan: usersTable.plan,
        subscriptionExpiresAt: usersTable.subscriptionExpiresAt 
      })
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    if (!dbUser) {
      unauthorized(res, "User not found in database");
      return;
    }

    let currentPlan = dbUser.plan;

    // Automatic Downgrade on Expiry
    if (currentPlan === "pro" && dbUser.subscriptionExpiresAt && dbUser.subscriptionExpiresAt < new Date()) {
      await db
        .update(usersTable)
        .set({ plan: "free", updatedAt: new Date() })
        .where(eq(usersTable.id, user.id));
      currentPlan = "free";
      req.log?.info?.({ userId: dbUser.id }, "User subscription expired, downgraded to free");
    }

    req.user = { id: dbUser.id, plan: currentPlan as "free" | "pro" };
    next();
  } catch (err) {
    req.log?.error?.({ err }, "Auth middleware error");
    unauthorized(res, "Authentication failed");
  }
}

export function requirePro(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.plan !== "pro") {
    forbidden(res, "Pro subscription required", "PRO_REQUIRED");
    return;
  }
  next();
}
