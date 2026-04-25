## Implementation Plan

## Phase 1 — Project Setup

- Initialize monorepo with `/client` and `/server` directories
- **Client**: React + TypeScript
- **Server**: Node.js + Express + TypeScript
- Set up PostgreSQL database

---

## Phase 2 — Database Schema

Define the full Prisma schema upfront:

- `User` — id, name, email, password hash, role (admin | agent), createdAt
- `Session` — id, userId, expiresAt (database sessions)
- `Ticket` — id, studentEmail, studentName, subject, body, status, category, assignedAgentId, createdAt, updatedAt
- `Message` — id, ticketId, body, sender (ai | agent | student), createdAt
- `KnowledgeArticle` — id, title, content, embedding (pgvector)

---

## Phase 3 — Authentication

- Password hashing (bcrypt)
- Login / logout endpoints
- Database session middleware (attach user to `req`)
- Seed script: creates the first admin on deploy
- Auth guard middleware (protected routes)
- Role guard middleware (admin-only routes)
- Login page (frontend)

---

## Phase 4 — User Management

- Admin: list all agents
- Admin: create agent (sends invite or sets temp password)
- Admin: deactivate/delete agent
- Agents page in dashboard (admin only)

---

## Phase 5 — Email Ingestion & Ticket Creation

- Inbound email webhook endpoint (POST `/webhooks/email`)
- Parse payload → create `Ticket` + first `Message`
- Handle threading: match reply to existing ticket by subject/email
- Immediate auto-reply to student: "we received your request"
- Ticket list visible in dashboard (basic, no filters yet)

---

## Phase 6 — Ticket Dashboard

- Ticket list page: filter by status + category, sort by date
- Ticket detail page: full message thread, student info, metadata
- Update ticket status (open → resolved → closed)
- Assign ticket to an agent
- Agent sees only their assigned tickets; admin sees all

---

## Phase 7 — AI Features

In order:

1. **Auto-classify** — on ticket creation, call Claude to assign category
2. **AI summary** — generate a short summary of the student's issue
3. **Knowledge base ingestion** — endpoint to upload articles, generate + store embeddings via pgvector
4. **RAG-powered reply generation** — retrieve relevant articles, generate a personalized response
5. **Escalation logic** — if AI confidence is low or category is "refund request", skip auto-send and route to agent
6. **AI-suggested reply** — show generated reply to agent in ticket detail for review before sending

---

## Phase 8 — Email Sending

- Send AI auto-response to student (SendGrid or Mailgun)
- Send escalation notification to assigned agent
- Reusable email templates (branded, not generic-looking)

---

## Phase 9 — Deployment

- Dockerfile for client and server
- Production Docker Compose
- Environment secrets management
- Deploy to chosen cloud provider (Railway / Fly.io / AWS)
