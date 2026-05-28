---
name: webhook-api-test-pattern
description: Pattern for pure API (non-browser) Playwright tests against Express endpoints not proxied through Vite
metadata:
  type: feedback
---

Pure API tests use Playwright's `request` fixture (APIRequestContext) with a hardcoded server URL (`http://localhost:3001`) rather than `baseURL` because the Vite dev server only proxies `/api/*` — endpoints like `/webhooks/*` are not forwarded.

The `request` fixture is available in any `test()` callback without any fixture setup; just call `request.post(url, { data })` directly.

**Why:** `/webhooks/email` is mounted at `app.use('/webhooks', ...)` in Express, outside the `/api` namespace, so Vite's proxy config `{ '/api': 'http://localhost:3001' }` never matches it.

**How to apply:** Any time a test targets a non-`/api` Express route (webhooks, health checks on non-standard paths, etc.), use the direct server URL constant rather than relying on `baseURL`.

Optional-env-var tests are skipped with `test.skip(true, reason)` inside `test.beforeEach` — consistent with the pattern of conditional skipping used elsewhere. The env var is documented in `e2e/.env.test.example` with a comment block.

See: `e2e/tests/webhook.spec.ts`
