---
name: project_tickets_patterns
description: TicketsPage e2e patterns — selectors, webhook seeding, ordering assertion
metadata:
  type: project
---

TicketsPage (`/tickets`) tests live at `e2e/tests/tickets.spec.ts`.

Key patterns confirmed in this file:

- **Card title selector**: `page.locator('[data-slot="card-title"]', { hasText: 'Tickets' })` — same pattern as UsersPage.
- **Empty state text**: `'No tickets yet.'` — exact string rendered by `TicketsTable` when `tickets.length === 0`.
- **Row helper**: `page.getByRole('row').filter({ hasText: subject })` — filter by subject text, same shape as `userRow()` in users.spec.ts.
- **"From" column**: renders `studentName` in a `<span>` and `studentEmail` in a second `<span>` inside the same cell — both are selectable via `getByText` within the row.
- **Status/category badges**: plain text content (`'open'`, `'general'`, etc.) inside `<Badge>` — select with `row.getByText('open')`.
- **Newest-first ordering**: use `.evaluate()` to find the DOM index of each row inside `tbody` and assert `secondRowIndex < firstRowIndex`.
- **Webhook seeding**: POST to `${process.env.BETTER_AUTH_URL}/webhooks/email` with `webhookHeaders()` using the `request` fixture — same pattern as `webhook.spec.ts`.
- **Default category**: tickets created via the webhook without an explicit category field default to `'general'`.
- **Login helper**: `loginAsAdminAndGoToTickets(page)` — logs in via UI, waits for `/`, then navigates to `/tickets` and asserts card title visible.

**Why:** The `request` fixture is Playwright's built-in API request context — it bypasses the Vite proxy and hits the Express server directly at `BETTER_AUTH_URL` (port 3001). The page fixture always goes through Vite (port 5174).

**How to apply:** When adding more ticket tests (detail view, filters, status updates), follow the same seeding-via-webhook and row-filter pattern established here.
