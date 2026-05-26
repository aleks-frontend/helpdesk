---
name: auth_helper_pattern
description: Pattern for admin login in e2e tests — inline helper function, no storageState fixture yet
metadata:
  type: feedback
---

All e2e test files use an inline `loginAsAdmin(page)` helper (or `loginAsAdminAndGoToUsers`) rather than a storageState fixture. The helper navigates to `/login`, fills Email/Password labels, clicks "Sign in", then awaits `waitForURL('/')`.

**Why:** storageState fixtures have not been introduced yet; each `test.describe` block calls the helper in a `beforeEach`-equivalent manner or directly in each test.

**How to apply:** Continue this pattern until the team explicitly adds a `e2e/fixtures/auth.ts` with storageState. Do not add `page.waitForLoadState('networkidle')` — specific element awaits are used instead (e.g. `expect(heading).toBeVisible()`).
