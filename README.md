# Healthcare Appointment Follow-up Manager

A Next.js 14 application for managing and automating healthcare appointment follow-ups.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database ORM**: Prisma (PostgreSQL)
- **Authentication**: NextAuth.js
- **AI**: Groq SDK
- **Email**: SendGrid
- **Calendar**: Google Calendar API
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment variables file:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in the required values in `.env.local`

5. Run Prisma migrations (once database models are defined):
   ```bash
   npx prisma migrate dev
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable React components
├── lib/              # Server-side business logic and utilities
├── schemas/          # Zod validation schemas
└── types/            # TypeScript type definitions
prisma/
└── schema.prisma     # Database schema
```

## Environment Variables

See `.env.example` for all required environment variables.

> ⚠️ Never commit `.env` or `.env.local` files to version control.
