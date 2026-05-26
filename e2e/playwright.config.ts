import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var ${name} in e2e/.env.test`)
  return value
}

const serverEnv = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  BETTER_AUTH_SECRET: requireEnv('BETTER_AUTH_SECRET'),
  BETTER_AUTH_URL: requireEnv('BETTER_AUTH_URL'),
  TRUSTED_ORIGINS: requireEnv('TRUSTED_ORIGINS'),
  NODE_ENV: 'test',
  PORT: '3001',
}

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npx tsx src/index.ts',
      port: 3001,
      timeout: 30_000,
      reuseExistingServer: !!process.env.PLAYWRIGHT_REUSE_SERVER,
      cwd: path.resolve(__dirname, '../server'),
      env: serverEnv,
    },
    {
      command: 'npx vite --port 5174',
      port: 5174,
      timeout: 30_000,
      reuseExistingServer: !!process.env.PLAYWRIGHT_REUSE_SERVER,
      cwd: path.resolve(__dirname, '../client'),
      env: { API_SERVER_URL: 'http://localhost:3001' },
    },
  ],
})
