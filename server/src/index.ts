import 'dotenv/config'
import express from 'express'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import { requireAuth } from './middleware/require-auth.js'

const app = express()
const port = process.env.PORT ?? 3000

app.all('/api/auth/{*any}', (req, res, next) => {
  toNodeHandler(auth)(req, res).catch(next)
})

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user, session: req.session })
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
