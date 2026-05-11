import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

const startTime = Date.now();

// Lightweight probe for load balancers / k8s
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// Deep health check with DB connectivity
router.get("/health", async (_req, res) => {
  const checks: Record<string, string> = {};
  let healthy = true;

  // Database check
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    checks.database = "ok";
  } catch {
    checks.database = "error";
    healthy = false;
  }

  const uptimeMs = Date.now() - startTime;
  const uptimeHours = Math.floor(uptimeMs / 3_600_000);
  const uptimeMinutes = Math.floor((uptimeMs % 3_600_000) / 60_000);

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "ok" : "degraded",
    checks,
    uptime: `${uptimeHours}h ${uptimeMinutes}m`,
    environment: process.env["NODE_ENV"] || "development",
    timestamp: new Date().toISOString(),
  });
});

export default router;

