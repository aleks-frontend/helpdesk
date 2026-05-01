import 'dotenv/config'
import express from 'express'
import { prisma } from './lib/prisma.js'

const app = express()
const port = process.env.PORT ?? 3000

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/info', (_req, res) => {
  res.json({
    serverTime: new Date().toISOString(),
    message: 'Hello from the server!',
  })
})

app.listen(port, async () => {
  await prisma.$connect()
  console.log(`Server running on http://localhost:${port}`)
})
