# ResumeAI — Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-stack AI-powered Resume & Cover Letter Builder mobile app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (`lib/db`)
- **Auth**: Supabase (mobile client) + Supabase Admin SDK (server-side token verify)
- **AI**: Anthropic Claude via Replit AI Integration (`lib/integrations-anthropic-ai`)
- **Payments**: Razorpay (₹99/mo or ₹699/yr Pro plan)
- **Mobile**: Expo + React Native (expo-router file-based routing)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec`)
- **Build**: esbuild

## Project Structure

```
artifacts/
  api-server/         — Express backend (port 8080, path /api)
  resume-ai/          — Expo React Native mobile app
lib/
  db/                 — Drizzle schema: users, resumes, cover_letters
  api-spec/           — OpenAPI spec + Orval codegen config
  api-client-react/   — Generated React Query hooks
  api-zod/            — Generated Zod schemas
  integrations-anthropic-ai/ — Anthropic Claude AI client
```

## Key Workflows

- `artifacts/api-server: API Server` — Express backend
- `artifacts/resume-ai: expo` — Expo mobile app (web + QR for native)

## Key Commands

- `pnpm --filter @workspace/api-server run dev` — start API server
- `pnpm --filter @workspace/resume-ai run dev` — start Expo app
- `pnpm --filter @workspace/api-spec run codegen` — regenerate hooks from OpenAPI
- `pnpm --filter @workspace/db run push` — push DB schema

## Environment Secrets Required

- `SUPABASE_URL` — Supabase project URL (https://xxx.supabase.co)
- `SUPABASE_ANON_KEY` — Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only)
- `RAZORPAY_KEY_ID` — Razorpay public key
- `RAZORPAY_KEY_SECRET` — Razorpay secret key
- `SESSION_SECRET` — Express session secret
- Anthropic AI keys auto-set by Replit AI integration

## Mobile App (artifacts/resume-ai)

### Screens / Routes
- `/(auth)/login` — Email/password sign in + sign up
- `/(tabs)/index` — Dashboard with quick actions, recent docs, usage bar
- `/(tabs)/documents` — All resumes and cover letters list
- `/(tabs)/profile` — User profile, plan info, sign out
- `/resume-builder` — Multi-step AI-powered resume builder (5 steps)
- `/cover-letter` — AI cover letter generator
- `/optimizer` — ATS score & keyword optimizer (Pro)
- `/interview-prep` — Interview question generator (Pro)

### Free vs Pro
- Free: 3 resumes/month, 3 cover letters/month
- Pro (₹99/mo or ₹699/yr): unlimited + optimizer + LinkedIn summary + interview prep

## API Routes (artifacts/api-server)

- `POST /api/auth/verify` — verify Supabase token, sync user to DB
- `GET/PUT /api/users/me` — get/update profile
- `GET/POST /api/resumes` — list/create resumes
- `GET/PUT/DELETE /api/resumes/:id` — manage individual resume
- `GET/POST /api/cover-letters` — list/create cover letters
- `GET/PUT/DELETE /api/cover-letters/:id` — manage individual cover letter
- `POST /api/ai/resume-summary` — generate professional summary
- `POST /api/ai/job-bullets` — generate achievement bullet points
- `POST /api/ai/cover-letter` — generate tailored cover letter
- `POST /api/ai/optimize-resume` — ATS score + suggestions (Pro)
- `POST /api/ai/linkedin-summary` — LinkedIn summary (Pro)
- `POST /api/ai/interview-questions` — interview Q&A (Pro)
- `POST /api/payments/create-order` — create Razorpay order
- `POST /api/payments/verify` — verify payment + upgrade to Pro

## DB Schema (lib/db)

- `users` — id (Supabase UID), email, name, plan (free/pro), usage counts, subscription expiry
- `resumes` — id, userId, title, data (JSONB), template, created/updatedAt
- `cover_letters` — id, userId, title, jobTitle, companyName, content, created/updatedAt
