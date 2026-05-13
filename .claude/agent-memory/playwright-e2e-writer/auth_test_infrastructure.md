---
name: Auth test infrastructure
description: Ports, credentials, admin seed name, selector patterns, and validation messages used in auth.spec.ts
type: project
---

## Ports and URLs
- Client dev server (e2e): port 5174, baseURL http://localhost:5174
- Server (e2e): port 3001; playwright.config.ts injects NODE_ENV=test + PORT=3001
- Vite proxy target for e2e: http://localhost:3001 (via API_SERVER_URL env var)

## Credentials
- Admin email/password: read from e2e/.env.test as ADMIN_EMAIL / ADMIN_PASSWORD
- Defaults: admin@example.com / TestPassword123!
- Admin user name (seeded in DB): "Admin" (hardcoded in server/prisma/seed.ts)
- No agent user is seeded — only one test user exists

## Selector patterns confirmed against source
- Email field: `page.getByLabel('Email')` — Label htmlFor="email"
- Password field: `page.getByLabel('Password')` — Label htmlFor="password"
- Submit button: `page.getByRole('button', { name: 'Sign in' })`
- Loading button text: 'Signing in…' (ellipsis char, not three dots)
- Helpdesk brand: `page.getByText('Helpdesk')` — plain <span> in nav
- Users nav link: `page.getByRole('link', { name: 'Users' })` — admin-only <Link>
- Sign out button: `page.getByRole('button', { name: 'Sign out' })`
- Dashboard heading: `page.getByRole('heading', { name: 'Dashboard' })`
- Users page heading: `page.getByRole('heading', { name: 'Users' })`

## Validation messages (zod schema in LoginPage.tsx)
- Invalid/empty email: "Enter a valid email address" (z.email() custom message)
- Empty password: "Password is required" (z.string().min(1) custom message)
- Form mode: onTouched — validation fires on blur, not on submit

## Error banner
- Auth errors render as `<p>` inside `.bg-destructive/10` div
- Better Auth message on bad credentials propagated via authError.message
- Fallback message: "Invalid email or password."
- Test matcher: `/invalid email or password/i` (case-insensitive)

## Route/redirect behaviour confirmed
- ProtectedRoute: while pending shows "Loading…"; no session → <Navigate to="/login" replace />
- AdminRoute: while pending returns null; role !== 'admin' → <Navigate to="/" replace />
- Unauthenticated /users hits ProtectedRoute first → lands on /login (not /)
- No redirect away from /login when already authenticated (app does not handle this case)

## Helper pattern used
```typescript
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
}
```

## Test counts
- Total tests in auth.spec.ts: 30 across 6 describe blocks
- All discovered cleanly by `playwright test --list`

**Why:** Capturing these to avoid re-reading all source files in future conversations.
**How to apply:** Use these selectors and messages directly when writing or extending auth tests; re-verify if source files change.
