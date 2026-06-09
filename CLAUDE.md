# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered helpdesk that receives student support emails, auto-generates personalized responses via Claude API (RAG over a knowledge base), and escalates low-confidence or refund tickets to human agents. Two roles: **admin** (manages agents) and **agent** (handles escalated tickets).

## Commands

This is an npm monorepo with `client`, `server`, and `e2e` workspaces.

```bash
# Run both client and server in dev mode
npm run dev

# Build everything
npm run build

# Run only the server (with file watching)
cd server && npm run dev

# Run only the client
cd client && npm run dev

# Seed the admin user (requires ADMIN_EMAIL and ADMIN_PASSWORD in server/.env)
cd server && bun prisma/seed.ts

# Run component (unit) tests
cd client && npm test

# Run component tests in watch mode
cd client && npm run test:watch

# Run e2e tests (stop dev server first — tests use ports 3001 and 5174)
npm run test:e2e

# Run e2e tests with Playwright UI
npm run test:e2e:ui
```

**Prefer unit tests over e2e tests.** Write component unit tests for all pages and components — they run fast, stay isolated, and catch regressions early. Only reach for e2e tests when verifying behaviour that genuinely requires a real browser, real auth session, and a running server (e.g. auth redirects, multi-step flows across client and server, webhook integration). Do not write e2e tests for things already covered by unit tests.

**E2e test scope rule:** Before writing any e2e test, check what unit tests already cover for that page/component. Only write e2e tests for scenarios that unit tests structurally cannot cover: real HTTP mutations persisting to the database, auth-gated redirects with a real session, multi-page flows, and cross-cutting behaviour that spans client and server. Rendering, loading states, error states, conditional display, and prop-driven UI are unit test territory — never duplicate them in e2e.

Use the **`component-unit-tester`** agent to write component unit tests. It has full knowledge of the test infrastructure, shared utilities, mocking patterns, and coverage conventions for this project.

Use the **`e2e-test-writer`** agent to write e2e tests. It has full knowledge of the test infrastructure, selector strategy, auth fixture patterns, and coverage checklists.

## Architecture

**Monorepo layout:**
- `core/` — shared Zod schemas and TypeScript types imported by both client and server
- `client/` — React 19 + TypeScript SPA, Vite 6, Tailwind v4, React Router v7
- `server/` — Express 5 on Bun runtime, TypeScript
- `e2e/` — Playwright end-to-end tests (Chromium only, single worker)

**Client → Server communication:** Vite dev server proxies `/api/*` to `http://localhost:3000`, so all API calls from the client use relative `/api/` paths.

**Backend stack (implemented):**
- PostgreSQL + Prisma ORM (prisma-client generator, output to `server/src/generated/prisma`)
- Prisma adapter: `@prisma/adapter-pg` (passed to `PrismaClient` constructor, no `datasourceUrl` in schema)
- Better Auth v1 for authentication — email/password only, sign-up disabled, database sessions (no JWT)
- Server auth config at `server/src/lib/auth.ts`; mounted at `POST /api/auth/{*any}` before `express.json()`

**Planned (not yet implemented):**
- pgvector for knowledge-base embeddings
- Claude API (`claude-sonnet-4-6`) for ticket classification, summarisation, RAG reply generation, and escalation decisions
- SendGrid or Mailgun for outbound email

**Current data model (Prisma schema):**
- `User` — id, name, email, emailVerified, image, role (admin | agent), createdAt, updatedAt
- `Session` — id, token, userId, expiresAt, ipAddress, userAgent
- `Account` — Better Auth credential/OAuth account record linked to User
- `Verification` — Better Auth email verification tokens
- `Ticket` — senderEmail, senderName, subject, body, status (open | resolved | closed), category (general | technical | refund), assignedAgentId
- `Reply` — id (autoincrement), body, senderType (customer | agent | ai), ticketId, userId (nullable → User), createdAt

**Planned models (not yet in schema):**
- `KnowledgeArticle` — title, content, embedding (pgvector)

**AI pipeline order** (Phase 7): auto-classify → summarise → RAG retrieval → reply generation → escalation check → agent-suggested reply UI.

## Client structure

```
client/src/
├── App.tsx                     # Route definitions
├── main.tsx                    # BrowserRouter entry point
├── index.css                   # @import "tailwindcss" only
├── lib/
│   ├── auth-client.ts          # Better Auth client (createAuthClient)
│   └── utils.ts
├── components/
│   ├── Layout.tsx              # Nav shell; admin-only links gated by role
│   ├── ProtectedRoute.tsx      # Redirects unauthenticated users to /login
│   ├── AdminRoute.tsx          # Redirects non-admins to /
│   └── ui/                     # shadcn/ui components (base-nova style)
└── pages/
    ├── LoginPage.tsx
    ├── HomePage.tsx
    └── UsersPage.tsx           # Admin only (/users)
```

**Routes:**
| Path | Protection | Page |
|------|-----------|------|
| `/login` | public | LoginPage |
| `/` | auth | HomePage |
| `/users` | auth + admin | UsersPage |

**Role access pattern:** Better Auth doesn't type `additionalFields` on the client by default. Access role with `(session?.user as { role?: string } | undefined)?.role`.

## Core structure

```
core/src/
├── index.ts              # Re-exports everything
└── schemas/
    ├── users.ts          # createUserSchema, updateUserSchema, Role, CreateUserInput, UpdateUserInput
    └── tickets.ts        # inboundEmailSchema, TicketStatus, TicketCategory, InboundEmailInput
```

## Server structure

```
server/src/
├── index.ts                    # Express app; auth handler, /api/health, /api/me
├── lib/
│   ├── auth.ts                 # betterAuth() config with prismaAdapter + role field
│   ├── prisma.ts               # PrismaClient singleton
│   └── validate-body.ts        # validateBody(schema, req.body, res) — returns parsed data or sends 400 and returns null
├── middleware/
│   └── require-auth.ts         # Express middleware; attaches req.user + req.session
├── routes/
│   ├── users.ts                # GET /api/users, POST /api/users, PATCH /api/users/:id, DELETE /api/users/:id (admin only)
│   ├── tickets.ts              # GET /api/tickets, GET/PATCH /api/tickets/:id (auth required)
│   ├── replies.ts              # GET/POST /api/tickets/:ticketId/replies (mergeParams router)
│   └── webhook.ts              # POST /webhooks/email — inbound email → ticket
└── generated/prisma/           # Prisma-generated client (do not edit)
```

## Documentation

Always use context7 (`mcp__context7`) to fetch up-to-date documentation when working with any library or framework used in this project (React, Express, Prisma, Tailwind, Vite, React Router, Better Auth, etc.). Do not rely on training data for API signatures, configuration, or version-specific behaviour.

## Key Conventions

- All client-side HTTP requests use **axios** via the shared instance at `client/src/lib/api.ts` (`baseURL: '/api'`). Never use `fetch` directly.
- All server state (data from `/api/*`) is fetched and cached with **TanStack Query** (`@tanstack/react-query`). Use `useQuery` for reads and `useMutation` for writes. The `QueryClientProvider` is set up in `main.tsx`. **Always use `useMutation` for POST and PATCH requests** — never use manual `useState` + `async function` patterns for these. Loading and error state come from the mutation object (`isPending`, `error`), not from separate `useState` calls.
- Server runs on port 3000 (`process.env.PORT` overrides).
- Express is v5 (async error handling works natively; no need for `express-async-errors`).
- Tailwind v4 is configured via the Vite plugin (`@tailwindcss/vite`), not `postcss.config.js`. CSS entry point is `client/src/index.css` with a single `@import "tailwindcss"`.
- Routing is client-side via React Router v7's `<BrowserRouter>`.
- Prisma schema has no `datasourceUrl` — connection string is passed via `PrismaPg` adapter constructor using `DATABASE_URL` env var.
- Better Auth is mounted with `app.all('/api/auth/{*any}', ...)` before `app.use(express.json())`.
- shadcn/ui uses the **base-nova** style; components live in `client/src/components/ui/`. Installed: button, card, input, label, skeleton, table, badge, dialog, textarea, error-message.
- Rate limiting (`express-rate-limit`) on auth routes is enabled only when `NODE_ENV=production`.
- Vite proxy target is configurable via `API_SERVER_URL` env var (defaults to `http://localhost:3000`).
- **Zod** is used for all data validation — on the server (request body parsing via `validateBody(schema, req.body, res)` from `server/src/lib/validate-body.ts`) and on the client (form schemas with `react-hook-form` + `@hookform/resolvers/zod`). Never write manual type/format checks when Zod can handle it. Never inline `safeParse` + 400 response in a route — use `validateBody` instead.
- **Shared schemas live in `core/`** — any Zod schema used by both client and server must be defined in `core/src/schemas/` and exported from `core/src/index.ts`. Both packages import from `'core'`. Never duplicate a schema across client and server.
- **Never hardcode role strings** — always import `Role` from `'core'` and use `Role.admin` / `Role.agent`. The `Role` const and its derived type live in `core/src/schemas/users.ts`.
- **Use `z.email()` for email validation**, not `z.string().email()` — the top-level `z.email()` is the Zod v4 API; the chained form is deprecated.
- **Use `<ErrorMessage>` for all inline field/form error text** — import from `@/components/ui/error-message` and use `<ErrorMessage>{errors.field.message}</ErrorMessage>`. Never use a raw `<p className="text-xs text-destructive">` for errors.
