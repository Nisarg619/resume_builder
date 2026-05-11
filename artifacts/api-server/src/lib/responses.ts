import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js";

// ── Standardized API response helpers ───────────────────────────────

export function success<T>(res: Response, data: T, status = 200): void {
  res.status(status).json(data);
}

export function created<T>(res: Response, data: T): void {
  res.status(201).json(data);
}

export function noContent(res: Response): void {
  res.status(204).send();
}

export function badRequest(res: Response, message: string, details?: Record<string, string>): void {
  res.status(400).json({ error: message, ...(details ? { details } : {}) });
}

export function unauthorized(res: Response, message = "Unauthorized"): void {
  res.status(401).json({ error: message });
}

export function forbidden(res: Response, message = "Forbidden", code?: string): void {
  res.status(403).json({ error: message, ...(code ? { code } : {}) });
}

export function notFound(res: Response, resource = "Resource"): void {
  res.status(404).json({ error: `${resource} not found` });
}

export function serverError(res: Response, message = "Internal server error"): void {
  res.status(500).json({ error: message });
}

// ── Global error handler middleware ─────────────────────────────────

export function globalErrorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const status = (err as Error & { status?: number }).status || 500;
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(status).json({ error: status >= 500 ? "Internal server error" : err.message });
}

// ── Input validation helpers ────────────────────────────────────────

export function requireFields<T extends Record<string, unknown>>(
  body: unknown,
  fields: string[],
): { valid: false; missing: string[] } | { valid: true; data: T } {
  const data = (body ?? {}) as Record<string, unknown>;
  const missing = fields.filter((f) => {
    const val = data[f];
    return val === undefined || val === null || (typeof val === "string" && val.trim() === "");
  });
  if (missing.length > 0) return { valid: false, missing };
  return { valid: true, data: data as T };
}

// ── Serializers (eliminate repeated formatting code) ─────────────────

export function serializeUser(u: {
  id: string; email: string; name: string | null; avatarUrl: string | null;
  plan: string; usageResumeCount: number; usageCoverLetterCount: number;
  subscriptionExpiresAt: Date | null; createdAt: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    plan: u.plan,
    usageResumeCount: u.usageResumeCount,
    usageCoverLetterCount: u.usageCoverLetterCount,
    subscriptionExpiresAt: u.subscriptionExpiresAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  };
}

export function serializeResume(r: {
  id: string; userId: string; title: string; data: unknown;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    id: r.id,
    userId: r.userId,
    title: r.title,
    data: r.data,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function serializeCoverLetter(l: {
  id: string; userId: string; title: string; jobTitle: string | null;
  companyName: string | null; content: string; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: l.id,
    userId: l.userId,
    title: l.title,
    jobTitle: l.jobTitle,
    companyName: l.companyName,
    content: l.content,
    createdAt: l.createdAt.toISOString(),
    updatedAt: l.updatedAt.toISOString(),
  };
}
