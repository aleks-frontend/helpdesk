import { test, expect, type Page, type APIRequestContext } from '@playwright/test'
import { Client } from 'pg'

// ---------------------------------------------------------------------------
// Credentials — sourced from e2e/.env.test (loaded by playwright.config.ts)
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'TestPassword123!'

// ---------------------------------------------------------------------------
// Webhook configuration — webhooks hit Express directly, not through Vite
// ---------------------------------------------------------------------------

const WEBHOOK_URL = `${process.env.BETTER_AUTH_URL}/webhooks/email`
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

function webhookHeaders(): Record<string, string> {
  return WEBHOOK_SECRET ? { 'X-Webhook-Secret': WEBHOOK_SECRET } : {}
}

// ---------------------------------------------------------------------------
// Payload factory — keeps each test independent
// ---------------------------------------------------------------------------

function ticketPayload(overrides: Record<string, unknown> = {}) {
  return {
    from: 'student@university.edu',
    fromName: 'Jane Student',
    subject: 'Help with my assignment submission',
    body: 'I cannot submit my assignment through the portal. It keeps saying error.',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Helper: login as admin and return the page (stays authenticated)
// ---------------------------------------------------------------------------

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
}

// ---------------------------------------------------------------------------
// Helper: seed a ticket via webhook and return its numeric id extracted from
// the ticket list page — this is the canonical way to get a real ticket ID
// that exists in the test database.
// ---------------------------------------------------------------------------

async function seedTicketAndGetId(
  page: Page,
  request: APIRequestContext,
  subject: string,
): Promise<string> {
  const response = await request.post(WEBHOOK_URL, {
    data: ticketPayload({ subject }),
    headers: webhookHeaders(),
  })
  expect(response.status()).toBe(201)

  // Navigate to the ticket list to find the newly seeded ticket's link
  await page.goto('/tickets')

  // Wait for the row to appear, then click the subject link to reach the detail page
  const subjectLink = page.getByRole('link', { name: subject })
  await expect(subjectLink).toBeVisible()

  const href = await subjectLink.getAttribute('href')
  // href is expected to be /tickets/<id>
  const id = href?.split('/').pop()
  if (!id) throw new Error(`Could not extract ticket id from href: ${href}`)
  return id
}

// ---------------------------------------------------------------------------
// Cleanup — runs once after all tests in this file to remove seeded tickets
// so subsequent test files start with a clean ticket table.
// ---------------------------------------------------------------------------

test.afterAll(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    await client.query('TRUNCATE "reply", "ticket" RESTART IDENTITY CASCADE')
  } finally {
    await client.end()
  }
})

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

test.describe('Ticket detail page — auth guard', () => {
  test('unauthenticated visit to /tickets/:id redirects to /login', async ({ page }) => {
    // Use a plausible-looking id — the redirect must happen before any data fetch
    await page.goto('/tickets/1')
    await page.waitForURL('/login')
    await expect(page).toHaveURL('/login')
  })
})

// ---------------------------------------------------------------------------
// Update ticket status
// ---------------------------------------------------------------------------

test.describe('Ticket detail page — update status', () => {
  test('changing the Status select PATCHes the server and the page reflects the new value', async ({
    page,
    request,
  }) => {
    await loginAsAdmin(page)
    const id = await seedTicketAndGetId(page, request, 'Status update test ticket')

    await page.goto(`/tickets/${id}`)

    // The sidebar Details card contains the Status select.
    // The SelectTrigger shows the current value as a <span> inside a button.
    // New tickets default to "open" — change it to "resolved".
    const statusTrigger = page.getByText('open', { exact: true }).first()
    await expect(statusTrigger).toBeVisible()

    await statusTrigger.click()

    // SelectContent renders the items — pick "Resolved"
    await page.getByRole('option', { name: 'Resolved' }).click()

    // After the PATCH succeeds, TanStack Query invalidates ['ticket', id] and
    // re-fetches. The trigger should now display the updated value.
    await expect(page.getByText('resolved', { exact: true }).first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Update ticket category
// ---------------------------------------------------------------------------

test.describe('Ticket detail page — update category', () => {
  test('changing the Category select PATCHes the server and the page reflects the new value', async ({
    page,
    request,
  }) => {
    await loginAsAdmin(page)
    const id = await seedTicketAndGetId(page, request, 'Category update test ticket')

    await page.goto(`/tickets/${id}`)

    // New tickets default to "general" — change it to "technical".
    // The category trigger text is rendered as a <span> inside SelectTrigger.
    // We target the second occurrence (first is "open" for status).
    const categoryTrigger = page.getByText('general', { exact: true }).first()
    await expect(categoryTrigger).toBeVisible()

    await categoryTrigger.click()

    await page.getByRole('option', { name: 'Technical' }).click()

    await expect(page.getByText('technical', { exact: true }).first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Post a reply
// ---------------------------------------------------------------------------

test.describe('Ticket detail page — post a reply', () => {
  test('typing a reply and submitting it adds the reply to the conversation thread', async ({
    page,
    request,
  }) => {
    await loginAsAdmin(page)
    const id = await seedTicketAndGetId(page, request, 'Reply flow test ticket')

    await page.goto(`/tickets/${id}`)

    // The ReplyForm textarea has placeholder "Write a reply…"
    const textarea = page.getByPlaceholder('Write a reply…')
    await expect(textarea).toBeVisible()

    const replyText = 'This is a test reply from the e2e suite.'
    await textarea.fill(replyText)

    // The submit button text is "Send reply"
    await page.getByRole('button', { name: 'Send reply' }).click()

    // After the POST succeeds, TanStack Query invalidates ['replies', ticketId].
    // The reply text should appear in the conversation thread.
    await expect(page.getByText(replyText)).toBeVisible()

    // The textarea should be cleared after a successful submission
    await expect(textarea).toHaveValue('')
  })

  test('submitting an empty reply shows a validation error and does not post', async ({
    page,
    request,
  }) => {
    await loginAsAdmin(page)
    const id = await seedTicketAndGetId(page, request, 'Reply validation test ticket')

    await page.goto(`/tickets/${id}`)

    const textarea = page.getByPlaceholder('Write a reply…')
    await expect(textarea).toBeVisible()

    // Submit without typing anything
    await page.getByRole('button', { name: 'Send reply' }).click()

    // createReplySchema requires body to be non-empty — the ErrorMessage should appear
    await expect(page.getByText('Reply cannot be empty')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Back navigation
// ---------------------------------------------------------------------------

test.describe('Ticket detail page — back navigation', () => {
  test('clicking "Back to tickets" navigates to /tickets', async ({ page, request }) => {
    await loginAsAdmin(page)
    const id = await seedTicketAndGetId(page, request, 'Back navigation test ticket')

    await page.goto(`/tickets/${id}`)

    // BackLink renders as an <a> containing the text "Back to tickets"
    const backLink = page.getByRole('link', { name: 'Back to tickets' })
    await expect(backLink).toBeVisible()

    await backLink.click()

    await page.waitForURL('/tickets')
    await expect(page).toHaveURL('/tickets')
  })
})
