---
name: High-Risk Areas for Future Security Scrutiny
description: Areas of the codebase that need close security review as the app grows (identified in May 2026 audit)
type: project
---

As of 2026-05-07 audit, these areas need security attention when implemented:

1. **Server-side /api/users route** — must add `requireRole('admin')` middleware; client-only guard is insufficient
2. **POST /webhooks/email** — planned inbound email webhook; needs HMAC signature verification (SendGrid/Mailgun), rate limiting, and input sanitization before passing to Claude
3. **Ticket routes** — when added, every query must filter by ownership or role to prevent IDOR (e.g., an agent reading another agent's tickets or student data)
4. **Claude API integration** — student email body must be treated as untrusted; prompt injection risk if email content is interpolated unsanitized into system prompts
5. **User update endpoint** — if a PATCH /api/users/:id or Better Auth `updateUser` hook is exposed, the `role` field must be explicitly excluded from user-controlled input
6. **Error handler** — no global Express error handler; add one before going to production to avoid stack trace leakage

**Why:** These were flagged as architectural risks during the first security audit because none of them existed yet but all are on the planned roadmap.
**How to apply:** When reviewing any of these new features, start with the risk noted here and verify it was addressed.
