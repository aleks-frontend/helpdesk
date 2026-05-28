import { test, expect } from '@playwright/test'

// Webhooks are not proxied through Vite, so we hit the Express server directly.
// BETTER_AUTH_URL already points at it (e.g. http://localhost:3001).
const WEBHOOK_URL = `${process.env.BETTER_AUTH_URL}/webhooks/email`

// Optional secret — when set in e2e/.env.test the server enforces it.
// When absent, the server skips the check and the secret-enforcement group is skipped.
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

// Returns the secret header when configured so non-enforcement tests work regardless.
function webhookHeaders(): Record<string, string> {
  return WEBHOOK_SECRET ? { 'X-Webhook-Secret': WEBHOOK_SECRET } : {}
}

// ---------------------------------------------------------------------------
// Valid payload factory — keeps each test independent
// ---------------------------------------------------------------------------

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    from: 'student@example.com',
    fromName: 'Test Student',
    subject: 'Help with my account',
    body: 'I cannot log in to my account. Please help.',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

test.describe('POST /webhooks/email — happy path', () => {
  test('valid payload returns 201 with ticket fields', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, { data: validPayload(), headers: webhookHeaders() })

    expect(response.status()).toBe(201)

    const body = await response.json()
    expect(body).toHaveProperty('ticket')
    expect(body.ticket).toMatchObject({
      studentEmail: 'student@example.com',
      subject: 'Help with my account',
    })
    expect(typeof body.ticket.id).toBe('string')
    expect(typeof body.ticket.createdAt).toBe('string')
  })

  test('omitting fromName returns 201 and studentName falls back to the email address', async ({ request }) => {
    const payload = validPayload()
    delete (payload as Record<string, unknown>).fromName

    const response = await request.post(WEBHOOK_URL, { data: payload, headers: webhookHeaders() })

    expect(response.status()).toBe(201)

    const body = await response.json()
    expect(body.ticket).toMatchObject({
      studentEmail: 'student@example.com',
      subject: 'Help with my account',
    })
  })
})

// ---------------------------------------------------------------------------
// Validation errors — each invalid input must produce a 400
// ---------------------------------------------------------------------------

test.describe('POST /webhooks/email — validation errors', () => {
  test('missing from field returns 400', async ({ request }) => {
    const payload = validPayload()
    delete (payload as Record<string, unknown>).from

    const response = await request.post(WEBHOOK_URL, { data: payload, headers: webhookHeaders() })

    expect(response.status()).toBe(400)
  })

  test('invalid email in from field returns 400', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: validPayload({ from: 'not-a-valid-email' }),
      headers: webhookHeaders(),
    })

    expect(response.status()).toBe(400)
  })

  test('empty subject returns 400', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: validPayload({ subject: '' }),
      headers: webhookHeaders(),
    })

    expect(response.status()).toBe(400)
  })

  test('whitespace-only subject returns 400', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: validPayload({ subject: '   ' }),
      headers: webhookHeaders(),
    })

    expect(response.status()).toBe(400)
  })

  test('empty body returns 400', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: validPayload({ body: '' }),
      headers: webhookHeaders(),
    })

    expect(response.status()).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// Secret enforcement — only runs when WEBHOOK_SECRET is set in e2e/.env.test
// ---------------------------------------------------------------------------

test.describe('POST /webhooks/email — secret enforcement', () => {
  test.beforeEach(() => {
    if (!WEBHOOK_SECRET) {
      test.skip(true, 'WEBHOOK_SECRET not set in e2e/.env.test — skipping secret enforcement tests')
    }
  })

  test('correct X-Webhook-Secret header returns 201', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: validPayload(),
      headers: { 'X-Webhook-Secret': WEBHOOK_SECRET! },
    })

    expect(response.status()).toBe(201)
  })

  test('wrong X-Webhook-Secret header returns 401', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: validPayload(),
      headers: { 'X-Webhook-Secret': 'wrong-secret-value' },
    })

    expect(response.status()).toBe(401)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })

  test('missing X-Webhook-Secret header returns 401', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, { data: validPayload() })

    expect(response.status()).toBe(401)

    const body = await response.json()
    expect(body).toHaveProperty('error')
  })
})
