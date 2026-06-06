import { Client } from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.resolve(__dirname, '.env.test') })

export default async function globalTeardown() {
  const testDbUrl = process.env.DATABASE_URL
  if (!testDbUrl) return

  const client = new Client({ connectionString: testDbUrl })
  await client.connect()

  try {
    // Truncate leaf tables first, then parent; CASCADE handles any remaining FK refs
    await client.query('TRUNCATE "reply", "ticket", "account", "session", "verification", "user" RESTART IDENTITY CASCADE')
    console.log('Test database cleared')
  } finally {
    await client.end()
  }
}
