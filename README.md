# HealthFollow — Healthcare Appointment Follow-up Manager

HealthFollow is a Next.js 14 application for managing and automating healthcare appointment workflows, AI-assisted visit preparation, and follow-up reminders. This repository contains the full source required to run the platform locally or deploy to a hosting provider such as Vercel.

Important: do not commit real secrets (`.env`, `.env.local`) to source control. Use `.env.example` as a template.

## Tech Stack

- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Database ORM: Prisma (PostgreSQL)
- Authentication: custom signed HTTP-only cookie sessions
- AI: Groq SDK
- Email: SendGrid
- Calendar: Google Calendar API
- Validation: Zod

## Getting Started (local development)

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm

### Quick Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment template and fill in values:

```bash
cp .env.example .env.local
# Edit .env.local and provide real credentials on your machine (DO NOT commit)
```

4. Validate Prisma schema and generate client:

```bash
npx prisma validate
npx prisma generate
```

5. Apply local migrations (development only):

```bash
npx prisma migrate dev
```

6. Start the development server:

```bash
npm run dev
```

Open http://localhost:3000 to view the application.

Live site (production): https://healthcare-appointment-follow-up-manager-lpimw0ri0-netal1.vercel.app

## Environment Variables

Use `.env.example` as the authoritative list. Key variables used by the project:

- `DATABASE_URL` — PostgreSQL connection string used by Prisma (example: `postgresql://USER:PASS@HOST:5432/DBNAME?schema=public`).
- `AUTH_SESSION_SECRET` — long random secret used to sign session tokens (required in production).
- `GROQ_API_KEY` — Groq AI key for summarization features (optional).
- `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL` — SendGrid email settings (optional).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — Google OAuth / Calendar (optional).
- `GOOGLE_CALENDAR_API_KEY`, `GOOGLE_CALENDAR_ID` — Google Calendar config (optional).
- `CRON_SECRET` — secret to protect cron endpoints (recommended if using cron routes).
- `NEXT_PUBLIC_APP_URL` — public app URL (e.g. `https://your-app.example`)

Do NOT copy real keys into the repo. Use hosting provider environment settings for production (Vercel, Railway, etc.).

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable React components
├── lib/              # Server-side business logic and utilities
├── schemas/          # Zod validation schemas
└── types/            # TypeScript type definitions
prisma/
└── schema.prisma     # Database schema (migrations are under prisma/migrations/)
```

## Deployment

Recommended platform: Vercel (Next.js App Router is fully supported). Basic steps:

1. Create a Vercel project and link the repository.
2. Add environment variables from `.env.example` in the Vercel project settings (use production values).
3. Set the build command to `npm run build` (default for Next.js) and let Vercel handle deployments.

Production database / Prisma notes:

- Ensure `AUTH_SESSION_SECRET` and `DATABASE_URL` are set in production.
- Apply migrations on your production database using `npx prisma migrate deploy` (recommended for CI/prod).
- Run `npx prisma generate` as part of your build/deploy step if your CI does not cache `node_modules`.

Manual deploy example (server/VM):

```bash
# install deps
npm ci

# generate prisma client
npx prisma generate

# apply migrations
npx prisma migrate deploy

# build and start
npm run build
npm start
```

## Database / Prisma

- Schema: `prisma/schema.prisma`
- Migrations: `prisma/migrations/` (do not delete; they document schema changes)

Use `npx prisma migrate dev` for local iterative development and `npx prisma migrate deploy` for production.

## Authentication

- Custom signed HTTP-only cookie sessions are implemented in `src/lib/auth.ts`.
- Role-based authorization exists (PATIENT, DOCTOR, ADMIN).
- The project migrated away from NextAuth; do not reintroduce NextAuth or change the custom auth architecture.

## AI / Email / Calendar integrations

- Groq SDK for AI-assisted summaries (`GROQ_API_KEY`).
- SendGrid for outgoing emails (`SENDGRID_API_KEY`).
- Google OAuth / Calendar integration is optional and controlled by the Google env vars.

## Verification / Helpful Commands

- Install dependencies:

```bash
npm install
```

- Prisma validate & generate:

```bash
npx prisma validate
npx prisma generate
```

- TypeScript check:

```bash
npx tsc --noEmit
```

- Lint:

```bash
npm run lint
```

- Build (production):

```bash
npm run build
```

## Notes for reviewers

- Authentication is custom and intentionally uses signed HTTP-only cookies.
- Appointment double-booking prevention is implemented via database-level unique constraints (`@@unique([doctorProfileId, startTime])`) and server-side slot holds.
- Prisma migrations are present and must be applied against the target database during deployment.

If you want, I can prepare a commit message for these documentation and cleanup changes so you can review and push them.
