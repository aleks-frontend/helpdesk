---
name: Auth & RBAC Architecture — First Audit Findings
description: Key security findings and architecture decisions from the May 2026 auth/RBAC audit
type: project
---

Auth uses Better Auth v1 with database sessions (no JWT). `requireAuth` middleware validated in `server/src/middleware/require-auth.ts` via `auth.api.getSession()`.

**Critical confirmed gap (as of 2026-05-07):** The `/api/users` route does NOT exist on the server yet. Only client-side `AdminRoute` guards the `/users` page. When a server-side `/api/users` route is added it MUST include a `requireRole('admin')` middleware — there is currently no `requireRole` helper.

**Key findings from first audit (status as of 2026-05-07):**

RESOLVED:
- `requireRole` middleware — created at `server/src/middleware/require-role.ts`
- `express.json({ limit: '50kb' })` — body size limit now set
- Global error handler — registered in `server/src/index.ts`
- Rate limiting on `/api/auth/*` — `express-rate-limit` v8 installed; 20 req / 15 min window, mounted before `toNodeHandler(auth)` in `index.ts`
- `TRUSTED_ORIGINS` silent fallback — now throws at startup in production if env var missing; falls back to `http://localhost:5173` in development

OPEN (not yet addressed):
- No security headers (helmet not installed)
- `BETTER_AUTH_SECRET` is read automatically from env by Better Auth; it is NOT explicitly passed in `betterAuth()` config — relies on env var being set at runtime
- Session cookie `secure` flag depends on `BETTER_AUTH_URL` using `https://` in production — confirm at deploy time
- No server-side `/api/users` route yet; UsersPage is a placeholder — when added, must include `requireRole('admin')`
- `disableSignUp: true` is correctly set
- Role field has `defaultValue: Role.agent` — new users cannot accidentally become admin

**Why:** These findings were from the initial auth/RBAC-focused security audit commissioned by the developer.
**How to apply:** When reviewing future commits touching routes, check for missing `requireRole` middleware. Flag any new `/api/users` implementation that lacks server-side role enforcement.
