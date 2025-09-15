# Project Structure

## Monorepo Organization

```
├── apps/                    # Applications
│   ├── api/                # Fastify API server
│   └── web/                # Next.js web application
├── packages/               # Shared packages
│   ├── auth/              # RBAC authorization system
│   └── env/               # Environment validation
├── config/                # Shared configurations
│   ├── eslint-config/     # ESLint configurations
│   ├── prettier/          # Prettier configuration
│   └── typescript-config/ # TypeScript configurations
└── .kiro/                 # Kiro steering files
```

## API Structure (`apps/api/`)

```
├── src/
│   ├── http/
│   │   ├── routes/        # API route handlers
│   │   ├── middlewares/   # Authentication & other middleware
│   │   ├── emails/        # Email templates & handlers
│   │   ├── prompts/       # AI prompts for interviews
│   │   ├── server.ts      # Fastify server setup
│   │   └── error-handler.ts
│   ├── lib/               # Core libraries
│   │   ├── prisma.ts      # Database client
│   │   ├── mail.ts        # Email service
│   │   └── cloudflare-r2.ts # File storage
│   ├── schemas/           # Zod validation schemas
│   ├── utils/             # Utility functions
│   └── errors/            # Error messages
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts           # Database seeding
└── @types/               # TypeScript definitions
```

## Web Structure (`apps/web/`)

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (app)/        # Authenticated app routes
│   │   │   ├── @dialog/  # Parallel route for modals
│   │   │   ├── account/  # Account settings
│   │   │   ├── interviews/ # Interview management
│   │   │   ├── playground/ # Interview practice
│   │   │   └── welcome/  # Onboarding
│   │   ├── api/          # API routes (OAuth callbacks)
│   │   ├── auth/         # Authentication pages
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   ├── header/      # Navigation components
│   │   ├── playground/  # Interview playground
│   │   ├── interviews/  # Interview components
│   │   └── ...          # Feature-specific components
│   ├── http/            # API client functions
│   │   ├── auth/        # Authentication requests
│   │   ├── account/     # Account management
│   │   ├── interviews/  # Interview API calls
│   │   ├── resumes/     # Resume management
│   │   └── ...          # Other API calls
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities & configurations
│   ├── schema/          # Zod validation schemas
│   └── utils/           # Helper functions
└── public/              # Static assets
```

## Shared Packages

### `packages/auth/`
- Authentication utilities and JWT handling
- User model definitions
- Session management helpers

### `packages/env/`
- Environment variable validation using T3 Env
- Shared environment schema

## Key Conventions

### File Naming
- **kebab-case** for files and folders
- **PascalCase** for React components
- **camelCase** for functions and variables
- **SCREAMING_SNAKE_CASE** for constants

### Route Organization
- API routes follow RESTful patterns
- Web routes use Next.js App Router conventions
- Parallel routes (`@dialog`) for modals
- Route groups `(app)` for layout organization

### Component Structure
- UI components in `components/ui/`
- Feature components grouped by domain
- Server actions co-located with components
- Form components include validation schemas

### Database Conventions
- **snake_case** for database columns
- **camelCase** for Prisma model fields
- Proper indexing on foreign keys and query fields
- Enum types for status and categorical fields

### Import Patterns
- Absolute imports using `@/` alias
- Workspace packages using `@saas/` prefix
- External dependencies imported normally
- Type-only imports when appropriate