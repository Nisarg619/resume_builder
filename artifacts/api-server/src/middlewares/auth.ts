import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userPlan?: string;
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const [dbUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    if (!dbUser) {
      res.status(401).json({ error: "User not found in database" });
      return;
    }

    req.userId = dbUser.id;
    req.userPlan = dbUser.plan;
    next();
  } catch (err) {
    res.status(401).json({ error: "Authentication failed" });
  }
}

export function requirePro(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.userPlan !== "pro") {
    res.status(403).json({ error: "Pro subscription required", code: "PRO_REQUIRED" });
    return;
  }
  next();
}
