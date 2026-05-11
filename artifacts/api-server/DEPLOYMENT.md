# ResumeAI Production Deployment Guide

This document outlines how to deploy the ResumeAI backend API server to production.

## Prerequisites

1. A PostgreSQL Database (Supabase, Neon, or Railway)
2. A Supabase project (for Authentication)
3. OpenRouter API Key (for AI features)
4. Razorpay Credentials (for Payments)
5. A hosting provider that supports Docker or Node.js (e.g., Railway, Render, Fly.io, AWS)

## Environment Variables

You must set the following environment variables in your production environment:

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | The port the server listens on (e.g., `3001`). Most PaaS providers set this automatically. |
| `NODE_ENV` | Yes | Must be set to `production`. |
| `DATABASE_URL` | Yes | Connection string for your PostgreSQL database (e.g., `postgres://user:pass@host:5432/db`). |
| `SUPABASE_URL` | Yes | Your Supabase project URL. |
| `SUPABASE_ANON_KEY` | Yes* | Your Supabase anon public key (required if `SUPABASE_SERVICE_ROLE_KEY` is not set). |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes* | Your Supabase service role key (recommended over anon key for backend). |
| `OPENROUTER_API_KEY` | Yes | API key from OpenRouter. |
| `CORS_ORIGINS` | Yes | Comma-separated list of allowed domains (e.g., `https://my-resume-app.com`). Wildcards (`*`) are blocked in production. |
| `RAZORPAY_KEY_ID` | Optional | Razorpay public key. |
| `RAZORPAY_KEY_SECRET` | Optional | Razorpay secret key. |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Secret used to verify incoming Razorpay webhooks. |
| `LOG_LEVEL` | Optional | Pino log level (`info`, `warn`, `error`). Defaults to `info` in production. |

## Deployment Options

### Option 1: Docker (Recommended)

The project includes a multi-stage `Dockerfile` optimized for production.

1. Build the image:
   ```bash
   docker build -t resume-ai-api -f artifacts/api-server/Dockerfile .
   ```
2. Run the container:
   ```bash
   docker run -p 3001:3001 --env-file .env resume-ai-api
   ```

### Option 2: Docker Compose (Self-Hosted)

If you are running on a single VPS (like DigitalOcean or AWS EC2), you can use the provided `docker-compose.yml` to spin up both the API server and a PostgreSQL database.

1. Copy `artifacts/api-server/.env.example` to `artifacts/api-server/.env` and fill in your keys.
2. Run:
   ```bash
   docker compose up -d
   ```

### Option 3: Platform as a Service (Railway / Render)

1. Connect your GitHub repository to Railway or Render.
2. Set the Root Directory to the repository root.
3. Choose **Dockerfile** deployment and point it to `artifacts/api-server/Dockerfile`.
4. Enter all the required Environment Variables in the platform's dashboard.
5. Deploy.

## Security Best Practices for Production

1. **Supabase Auth**: Ensure `DEV_BYPASS_AUTH` is strictly removed or set to `false`. The server will ignore it anyway if `NODE_ENV=production`.
2. **CORS**: Set `CORS_ORIGINS` strictly to the domains/subdomains your frontend app is hosted on. If you have a mobile app (React Native/Expo), mobile requests typically have no `Origin` header, which the backend is configured to allow by default.
3. **Webhooks**: Always configure `RAZORPAY_WEBHOOK_SECRET`. The backend strictly verifies the HMAC signature of incoming webhooks.
4. **Database Access**: Ensure your PostgreSQL database is securely locked down, accessible only by your backend API IP addresses.

## Health Checks

The backend provides two endpoints for monitoring:
- `GET /api/healthz` - Lightweight, returns 200 OK. Use this for Load Balancer pings.
- `GET /api/health` - Deep health check. Validates DB connectivity and returns uptime/environment info.

## Graceful Shutdown

The Node.js server handles `SIGTERM` and `SIGINT` signals to perform a graceful shutdown. It stops accepting new connections, waits for existing requests to finish, cleanly closes the database connection pool, and exits. It forces an exit after 10 seconds to prevent hanging.
