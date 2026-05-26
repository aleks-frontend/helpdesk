import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Credentials — sourced from e2e/.env.test (loaded by playwright.config.ts)
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'TestPassword123!'

// ---------------------------------------------------------------------------
// Test user — created in beforeAll, edited and deleted across the suite
// ---------------------------------------------------------------------------

const TEST_USER = {
  name: 'Playwright Agent',
  email: 'playwright-agent@example.com',
  password: 'AgentPass123!',
  updatedName: 'Playwright Agent Updated',
}

// ---------------------------------------------------------------------------
// Helper: perform a full admin login and land on /users
// ---------------------------------------------------------------------------

async function loginAsAdminAndGoToUsers(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
  await page.goto('/users')
  await expect(page.locator('[data-slot="card-title"]', { hasText: 'Users' })).toBeVisible()
}

// ---------------------------------------------------------------------------
// Helper: find the table row for a given user name
// ---------------------------------------------------------------------------

function userRow(page: Page, name: string) {
  return page.getByRole('row').filter({ hasText: name })
}

// ---------------------------------------------------------------------------
// Read (List)
// ---------------------------------------------------------------------------

test.describe('Users page — list', () => {
  test('heading "Users" is visible after navigating to /users', async ({ page }) => {
    await loginAsAdminAndGoToUsers(page)
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Users' })).toBeVisible()
  })

  test('the seeded admin user appears in the table', async ({ page }) => {
    await loginAsAdminAndGoToUsers(page)
    const row = userRow(page, ADMIN_EMAIL)
    await expect(row).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

test.describe('Users page — create', () => {
  test('admin can create a new agent user', async ({ page }) => {
    await loginAsAdminAndGoToUsers(page)

    // Open the create dialog
    await page.getByRole('button', { name: 'Create user' }).click()

    // Dialog should open with the correct title
    await expect(page.locator('[data-slot="dialog-title"]')).toContainText('Create user')

    // Fill the form
    await page.getByLabel('Name').fill(TEST_USER.name)
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)

    // Submit
    await page.getByRole('button', { name: 'Create user' }).click()

    // Dialog closes and new user appears in the table
    await expect(page.locator('[data-slot="dialog-content"]')).not.toBeVisible()
    await expect(userRow(page, TEST_USER.name)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Update (Edit)
// ---------------------------------------------------------------------------

test.describe('Users page — edit', () => {
  test('admin can edit the name of a non-admin user', async ({ page }) => {
    await loginAsAdminAndGoToUsers(page)

    // Find the test user's row and click its edit button
    const row = userRow(page, TEST_USER.name)
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: 'Edit user' }).click()

    // Dialog should open with the correct title
    await expect(page.locator('[data-slot="dialog-title"]')).toContainText('Edit user')

    // Name field should be pre-populated; clear it and type the new name
    const nameField = page.getByLabel('Name')
    await expect(nameField).toBeVisible()
    await nameField.clear()
    await nameField.fill(TEST_USER.updatedName)

    // Submit
    await page.getByRole('button', { name: 'Save changes' }).click()

    // Dialog closes and updated name appears in the table
    await expect(page.locator('[data-slot="dialog-content"]')).not.toBeVisible()
    await expect(userRow(page, TEST_USER.updatedName)).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

test.describe('Users page — delete', () => {
  test('admin can delete a non-admin user', async ({ page }) => {
    await loginAsAdminAndGoToUsers(page)

    // Find the (updated) test user's row and click its delete button
    const row = userRow(page, TEST_USER.updatedName)
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: 'Delete user' }).click()

    // Confirmation dialog should open with the correct title
    await expect(page.locator('[data-slot="dialog-title"]')).toContainText('Delete user')

    // Confirm deletion
    await page.getByRole('button', { name: 'Delete user' }).click()

    // Dialog closes and user is removed from the table
    await expect(page.locator('[data-slot="dialog-content"]')).not.toBeVisible()
    await expect(userRow(page, TEST_USER.updatedName)).not.toBeVisible()
  })

  test('delete button is disabled for admin users', async ({ page }) => {
    await loginAsAdminAndGoToUsers(page)

    // The admin's own row — its delete button must be disabled
    const adminRow = userRow(page, ADMIN_EMAIL)
    await expect(adminRow).toBeVisible()
    await expect(adminRow.getByRole('button', { name: 'Delete user' })).toBeDisabled()
  })
})
