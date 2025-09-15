# Technology Stack

## Build System & Tooling

- **Monorepo**: Turborepo with PNPM workspaces
- **Package Manager**: PNPM 9.12.2
- **Build Tool**: Turbo for orchestration, tsup for API builds
- **TypeScript**: Full TypeScript setup across all packages
- **Linting**: ESLint with shared configs
- **Formatting**: Prettier with shared configs

## Backend (API)

- **Runtime**: Node.js 18+
- **Framework**: Fastify 5.x with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with RS256 keys, bcryptjs for hashing
- **AI Integration**: OpenAI GPT for interview conversations
- **Validation**: Zod schemas with fastify-type-provider-zod
- **File Storage**: AWS SDK + Cloudflare R2 for resume uploads
- **Email**: Nodemailer with Gmail SMTP for notifications
- **Documentation**: Swagger/OpenAPI with Fastify plugins
- **Real-time**: LiveKit for video/audio interview sessions
- **PDF Processing**: PDF parsing for resume analysis

## Frontend (Web)

- **Framework**: Next.js 15 with App Router
- **React**: React 19 RC
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: KY for API requests
- **Forms**: React Hook Form patterns
- **Icons**: Tabler Icons, Lucide React
- **Notifications**: React Hot Toast
- **Themes**: next-themes for dark/light mode

## Shared Packages

- **Auth**: Authentication utilities (`@saas/auth`)
- **Environment**: T3 Env for validation (`@saas/env`)
- **Config**: Shared ESLint, Prettier, TypeScript configs

## Development Commands

```bash
# Root level
pnpm dev          # Start all apps in development
pnpm build        # Build all apps
pnpm lint         # Lint all packages

# API specific (from apps/api)
pnpm dev          # Start API dev server
pnpm build        # Build for production
pnpm db:migrate   # Run Prisma migrations
pnpm db:studio    # Open Prisma Studio
pnpm db:reset     # Reset database
pnpm db:seed      # Seed database

# Web specific (from apps/web)
pnpm dev          # Start Next.js dev server
pnpm build        # Build for production
pnpm lint         # Lint Next.js app
```

## Environment Setup

- Copy `.env.example` to `.env` and configure
- Requires PostgreSQL database
- Generate RS256 JWT keys with OpenSSL
- Configure OAuth apps (GitHub, Google)
- Setup Cloudflare R2 bucket for file storage
- Configure Gmail SMTP for emails
- Add OpenAI API key for AI interview features
- Setup LiveKit account for video/audio sessions

## Deployment

- **Database**: Neon (PostgreSQL)
- **API**: Render
- **Frontend**: Vercel
- **Storage**: Cloudflare R2