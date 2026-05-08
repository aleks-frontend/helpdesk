import { execSync } from 'child_process'
import { Client } from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

export default async function globalSetup() {
  const testDbUrl = process.env.DATABASE_URL
  if (!testDbUrl) {
    throw new Error('DATABASE_URL not set — copy e2e/.env.test.example to e2e/.env.test and fill in values')
  }

  await ensureTestDatabase(testDbUrl)
  runMigrations(testDbUrl)
}

async function ensureTestDatabase(testDbUrl: string) {
  const url = new URL(testDbUrl)
  const dbName = url.pathname.replace(/^\//, '').split('?')[0]

  // Connect to the default postgres database to check/create the test DB
  url.pathname = '/postgres'
  const client = new Client({ connectionString: url.toString() })
  await client.connect()

  try {
    const { rows } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
    if (rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`)
      console.log(`Created test database: ${dbName}`)
    } else {
      console.log(`Using existing test database: ${dbName}`)
    }
  } finally {
    await client.end()
  }
}

function runMigrations(testDbUrl: string) {
  console.log('Running migrations on test database...')
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../server'),
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit',
  })
}
