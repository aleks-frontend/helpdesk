# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered helpdesk that receives student support emails, auto-generates personalized responses via Claude API (RAG over a knowledge base), and escalates low-confidence or refund tickets to human agents. Two roles: **admin** (manages agents) and **agent** (handles escalated tickets).

## Commands

This is an npm monorepo with `client` and `server` workspaces.

```bash
# Run both client and server in dev mode
npm run dev

# Build everything
npm run build

# Run only the server (with file watching)
cd server && npm run dev

# Run only the client
cd client && npm run dev
```

No test runner is configured yet. When adding tests, use `node --test` or install a test runner.

## Architecture

**Monorepo layout:**
- `client/` — React 19 + TypeScript SPA, Vite 6, Tailwind v4, React Router v7
- `server/` — Express 5 on Bun runtime, TypeScript

**Client → Server communication:** Vite dev server proxies `/api/*` to `http://localhost:3000`, so all API calls from the client use relative `/api/` paths.

**Planned backend stack** (not yet implemented):
- PostgreSQL + pgvector for ticket data and knowledge-base embeddings
- Prisma ORM
- Database sessions for auth (no JWT)
- Claude API (`claude-sonnet-4-6`) for ticket classification, summarisation, RAG reply generation, and escalation decisions
- SendGrid or Mailgun for outbound email
- Inbound email via webhook at `POST /webhooks/email`

**Data model (Prisma, to be created):**
- `User` — id, name, email, passwordHash, role (admin | agent)
- `Session` — id, userId, expiresAt
- `Ticket` — studentEmail, studentName, subject, body, status (open | resolved | closed), category (general | technical | refund), assignedAgentId
- `Message` — ticketId, body, sender (ai | agent | student)
- `KnowledgeArticle` — title, content, embedding (pgvector)

**AI pipeline order** (Phase 7): auto-classify → summarise → RAG retrieval → reply generation → escalation check → agent-suggested reply UI.

## Documentation

Always use context7 (`mcp__context7`) to fetch up-to-date documentation when working with any library or framework used in this project (React, Express, Prisma, Tailwind, Vite, React Router, etc.). Do not rely on training data for API signatures, configuration, or version-specific behaviour.

## Key Conventions

- Server runs on port 3000 (`process.env.PORT` overrides).
- Express is v5 (async error handling works natively; no need for `express-async-errors`).
- Tailwind v4 is configured via the Vite plugin (`@tailwindcss/vite`), not `postcss.config.js`. CSS entry point is `client/src/index.css` with a single `@import "tailwindcss"`.
- Routing is client-side via React Router v7's `<BrowserRouter>`.
