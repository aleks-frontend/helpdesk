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
  PORT: '3000',
}

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
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
      command: 'npm run dev --workspace=server',
      port: 3000,
      timeout: 30_000,
      reuseExistingServer: false,
      cwd: path.resolve(__dirname, '..'),
      env: serverEnv,
    },
    {
      command: 'npm run dev --workspace=client',
      port: 5173,
      timeout: 30_000,
      reuseExistingServer: false,
      cwd: path.resolve(__dirname, '..'),
    },
  ],
})
