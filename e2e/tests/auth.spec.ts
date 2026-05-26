import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Credentials — sourced from e2e/.env.test (loaded by playwright.config.ts)
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@example.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'TestPassword123!'
const ADMIN_NAME = 'Admin'

// ---------------------------------------------------------------------------
// Helper: perform a full admin login and wait for the home page
// ---------------------------------------------------------------------------

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
}

// ---------------------------------------------------------------------------
// Login page — static rendering & form fields
// ---------------------------------------------------------------------------

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders the card title and description', async ({ page }) => {
    await expect(page.locator('[data-slot="card-title"]')).toContainText('Sign in')
    await expect(page.getByText('Enter your credentials to access Helpdesk')).toBeVisible()
  })

  test('renders email and password fields', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('email field has correct placeholder', async ({ page }) => {
    await expect(page.getByLabel('Email')).toHaveAttribute('placeholder', 'you@example.com')
  })

  test('password field is masked', async ({ page }) => {
    await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password')
  })

  test('submit button is visible and enabled by default', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Sign in' })
    await expect(button).toBeVisible()
    await expect(button).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Client-side validation (zod, mode: onTouched)
// ---------------------------------------------------------------------------

test.describe('Client-side validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('shows error when email is touched and left blank', async ({ page }) => {
    // Focus the email field, then blur without typing anything
    await page.getByLabel('Email').focus()
    await page.getByLabel('Password').focus() // blur email by focusing next field
    await expect(page.getByText('Enter a valid email address')).toBeVisible()
  })

  test('shows error when email format is invalid', async ({ page }) => {
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel('Password').focus() // trigger onBlur
    await expect(page.getByText('Enter a valid email address')).toBeVisible()
  })

  test('shows error when password is touched and left blank', async ({ page }) => {
    await page.getByLabel('Password').focus()
    await page.getByLabel('Email').focus() // blur password
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('clears email error once a valid email is entered', async ({ page }) => {
    // Trigger the error first
    await page.getByLabel('Email').fill('bad')
    await page.getByLabel('Password').focus()
    await expect(page.getByText('Enter a valid email address')).toBeVisible()

    // Fix it
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').focus()
    await expect(page.getByText('Enter a valid email address')).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Server-side auth errors
// ---------------------------------------------------------------------------

test.describe('Authentication errors', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('shows error message for wrong password', async ({ page }) => {
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill('WrongPassword999!')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Better Auth returns an error; LoginPage falls back to "Invalid email or password."
    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  })

  test('shows error message for non-existent email', async ({ page }) => {
    await page.getByLabel('Email').fill('nobody@example.com')
    await page.getByLabel('Password').fill('SomePassword1!')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
  })

  test('error message is inside the destructive banner element', async ({ page }) => {
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill('Wrong!')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // The error message is a <p> with bg-destructive/10 class directly on it
    const banner = page.locator('.bg-destructive\\/10')
    await expect(banner).toBeVisible()
    await expect(banner).toContainText(/invalid email or password/i)
  })

  test('stays on /login after failed login attempt', async ({ page }) => {
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill('BadPass!')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText(/invalid email or password/i)).toBeVisible()
    await expect(page).toHaveURL('/login')
  })
})

// ---------------------------------------------------------------------------
// Successful login
// ---------------------------------------------------------------------------

test.describe('Successful login', () => {
  test('admin login redirects to /', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign in' }).click()

    await page.waitForURL('/')
    await expect(page).toHaveURL('/')
  })

  test('nav shows the Helpdesk brand after login', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText('Helpdesk')).toBeVisible()
  })

  test('nav shows the admin user name after login', async ({ page }) => {
    await loginAsAdmin(page)
    // The Layout renders session.user.name in a <span>
    await expect(page.getByText(ADMIN_NAME)).toBeVisible()
  })

  test('nav shows the Users link for admin role', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible()
  })

  test('dashboard heading is visible after login', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('submit button is disabled while signing in', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL('/')
  })
})

// ---------------------------------------------------------------------------
// Auth guards — unauthenticated access
// ---------------------------------------------------------------------------

test.describe('Auth guards', () => {
  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('/login')
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated visit to /users redirects to /login', async ({ page }) => {
    await page.goto('/users')
    await page.waitForURL('/login')
    await expect(page).toHaveURL('/login')
  })

  test('login page renders normally when visiting unauthenticated', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('[data-slot="card-title"]')).toContainText('Sign in')
  })
})

// ---------------------------------------------------------------------------
// Admin route access
// ---------------------------------------------------------------------------

test.describe('Admin access', () => {
  test('admin can navigate to /users and page loads', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/users')
    await page.waitForURL('/users')
    await expect(page).toHaveURL('/users')
    // Nav should still be visible — confirms Layout rendered correctly
    await expect(page.getByText('Helpdesk')).toBeVisible()
  })

  test('admin can navigate to /users via the Users nav link', async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole('link', { name: 'Users' }).click()
    await page.waitForURL('/users')
    await expect(page).toHaveURL('/users')
  })

  test('/users page renders Users card title for admin', async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/users')
    await expect(page.locator('[data-slot="card-title"]', { hasText: 'Users' })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

test.describe('Sign out', () => {
  test('sign out redirects to /login', async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.waitForURL('/login')
    await expect(page).toHaveURL('/login')
  })

  test('navigating to / after sign out redirects back to /login', async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.waitForURL('/login')

    await page.goto('/')
    await page.waitForURL('/login')
    await expect(page).toHaveURL('/login')
  })

  test('navigating to /users after sign out redirects to /login', async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.waitForURL('/login')

    await page.goto('/users')
    await page.waitForURL('/login')
    await expect(page).toHaveURL('/login')
  })

  test('login form is shown again after sign out', async ({ page }) => {
    await loginAsAdmin(page)
    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.waitForURL('/login')

    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('user name is no longer visible after sign out', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText(ADMIN_NAME)).toBeVisible()

    await page.getByRole('button', { name: 'Sign out' }).click()
    await page.waitForURL('/login')

    // The nav with the user name is gone — we are on the login card now
    await expect(page.getByText(ADMIN_NAME)).not.toBeVisible()
  })
})
