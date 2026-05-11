import { logger } from "./logger.js";

interface EnvVar {
  name: string;
  required: boolean;
  secret?: boolean;
}

const ENV_VARS: EnvVar[] = [
  // Required
  { name: "PORT", required: true },
  { name: "DATABASE_URL", required: true, secret: true },
  { name: "SUPABASE_URL", required: true },
  { name: "OPENROUTER_API_KEY", required: true, secret: true },

  // Supabase auth (at least one must be set)
  { name: "SUPABASE_ANON_KEY", required: false, secret: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: false, secret: true },

  // Optional
  { name: "NODE_ENV", required: false },
  { name: "CORS_ORIGINS", required: false },
  { name: "LOG_LEVEL", required: false },
  { name: "OPENROUTER_MODEL_FREE", required: false },
  { name: "OPENROUTER_MODEL_PRO", required: false },
  { name: "OPENROUTER_MODEL_FREE_FALLBACK", required: false },
  { name: "OPENROUTER_MODEL_PRO_FALLBACK", required: false },
  { name: "SITE_URL", required: false },
  { name: "RAZORPAY_KEY_ID", required: false, secret: true },
  { name: "RAZORPAY_KEY_SECRET", required: false, secret: true },
  { name: "RAZORPAY_WEBHOOK_SECRET", required: false, secret: true },
];

export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const v of ENV_VARS) {
    const value = process.env[v.name];
    if (v.required && !value) {
      missing.push(v.name);
    }
  }

  // Special check: at least one Supabase key must be set (unless DEV_BYPASS_AUTH)
  if (
    !process.env["SUPABASE_ANON_KEY"] &&
    !process.env["SUPABASE_SERVICE_ROLE_KEY"] &&
    process.env["DEV_BYPASS_AUTH"] !== "true"
  ) {
    missing.push("SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY");
  }

  // Warnings for production
  if (process.env["NODE_ENV"] === "production") {
    if (!process.env["CORS_ORIGINS"]) {
      warnings.push("CORS_ORIGINS is not set — all origins will be rejected in production.");
    }
    if (process.env["DEV_BYPASS_AUTH"] === "true") {
      warnings.push("DEV_BYPASS_AUTH is set but will be IGNORED in production.");
    }
    if (!process.env["RAZORPAY_WEBHOOK_SECRET"]) {
      warnings.push("RAZORPAY_WEBHOOK_SECRET is not set — webhook verification will fail.");
    }
  }

  for (const w of warnings) {
    logger.warn(w);
  }

  if (missing.length > 0) {
    logger.fatal({ missing }, "Missing required environment variables — server cannot start.");
    process.exit(1);
  }

  // Log successful validation (mask secrets)
  const loaded: Record<string, string> = {};
  for (const v of ENV_VARS) {
    const val = process.env[v.name];
    if (val) {
      loaded[v.name] = v.secret ? `***${val.slice(-4)}` : val;
    }
  }
  logger.info({ env: loaded }, "Environment validated");
}
