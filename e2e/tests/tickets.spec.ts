import { test, expect, type Page } from '@playwright/test'

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
    subject: 'Cannot access my course materials',
    body: 'I have been unable to access the course materials since yesterday.',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Helper: login as admin and navigate to /tickets
// ---------------------------------------------------------------------------

async function loginAsAdminAndGoToTickets(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
  await page.goto('/tickets')
  await expect(page.locator('[data-slot="card-title"]', { hasText: 'Tickets' })).toBeVisible()
}

// ---------------------------------------------------------------------------
// Helper: find the table row containing a given subject
// ---------------------------------------------------------------------------

function ticketRow(page: Page, subject: string) {
  return page.getByRole('row').filter({ hasText: subject })
}

// ---------------------------------------------------------------------------
// Auth guard
// ---------------------------------------------------------------------------

test.describe('Tickets page — auth guard', () => {
  test('unauthenticated visit to /tickets redirects to /login', async ({ page }) => {
    await page.goto('/tickets')
    await page.waitForURL('/login')
    await expect(page).toHaveURL('/login')
  })
})

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

test.describe('Tickets page — navigation', () => {
  test('"Tickets" nav link is visible for admin after login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('/')
    await expect(page.getByRole('link', { name: 'Tickets' })).toBeVisible()
  })

  test('clicking "Tickets" nav link navigates to /tickets', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('/')
    await page.getByRole('link', { name: 'Tickets' }).click()
    await page.waitForURL('/tickets')
    await expect(page).toHaveURL('/tickets')
  })
})

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

test.describe('Tickets page — empty state', () => {
  test('shows "No tickets yet." when there are no tickets in the database', async ({ page }) => {
    await loginAsAdminAndGoToTickets(page)
    await expect(page.getByText('No tickets yet.')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Single ticket display
// ---------------------------------------------------------------------------

test.describe('Tickets page — ticket display', () => {
  test('ticket row shows subject, student name, email, status badge, and category badge', async ({
    page,
    request,
  }) => {
    // Seed a ticket via the webhook
    const response = await request.post(WEBHOOK_URL, {
      data: ticketPayload(),
      headers: webhookHeaders(),
    })
    expect(response.status()).toBe(201)

    await loginAsAdminAndGoToTickets(page)

    const row = ticketRow(page, 'Cannot access my course materials')
    await expect(row).toBeVisible()

    // Subject
    await expect(row.getByText('Cannot access my course materials')).toBeVisible()

    // Student name and email (rendered in the "From" column)
    await expect(row.getByText('Jane Student')).toBeVisible()
    await expect(row.getByText('student@university.edu')).toBeVisible()

    // Status badge — new tickets default to "open"
    await expect(row.getByText('open')).toBeVisible()

    // Category badge — webhook-created tickets without explicit category default to "general"
    await expect(row.getByText('general')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Newest first ordering
// ---------------------------------------------------------------------------

test.describe('Tickets page — newest first', () => {
  test('most recently created ticket appears before an earlier one', async ({
    page,
    request,
  }) => {
    // Create first ticket
    const first = await request.post(WEBHOOK_URL, {
      data: ticketPayload({ subject: 'First ticket subject' }),
      headers: webhookHeaders(),
    })
    expect(first.status()).toBe(201)

    // Create second ticket (newer)
    const second = await request.post(WEBHOOK_URL, {
      data: ticketPayload({ subject: 'Second ticket subject' }),
      headers: webhookHeaders(),
    })
    expect(second.status()).toBe(201)

    await loginAsAdminAndGoToTickets(page)

    // Both rows must be present
    await expect(ticketRow(page, 'Second ticket subject')).toBeVisible()
    await expect(ticketRow(page, 'First ticket subject')).toBeVisible()

    // The second (newer) ticket row must appear before the first (older) one in the DOM
    const secondRowIndex = await page
      .getByRole('row')
      .filter({ hasText: 'Second ticket subject' })
      .evaluate((el) => {
        const rows = Array.from(el.closest('tbody')!.querySelectorAll('tr'))
        return rows.indexOf(el as HTMLTableRowElement)
      })

    const firstRowIndex = await page
      .getByRole('row')
      .filter({ hasText: 'First ticket subject' })
      .evaluate((el) => {
        const rows = Array.from(el.closest('tbody')!.querySelectorAll('tr'))
        return rows.indexOf(el as HTMLTableRowElement)
      })

    expect(secondRowIndex).toBeLessThan(firstRowIndex)
  })
})
