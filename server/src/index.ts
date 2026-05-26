import 'dotenv/config'
import express from 'express'
import type { ErrorRequestHandler } from 'express'
import { rateLimit } from 'express-rate-limit'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import { requireAuth } from './middleware/require-auth.js'
import { usersRouter } from './routes/users.js'
import { webhookRouter } from './routes/webhook.js'
import { ticketsRouter } from './routes/tickets.js'

const app = express()
const port = process.env.PORT ?? 3000

const authRateLimit = process.env.NODE_ENV === 'production'
  ? rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many login attempts, please try again later.' },
    })
  : (_req: express.Request, _res: express.Response, next: express.NextFunction) => next()

app.all('/api/auth/{*any}', authRateLimit, (req, res, next) => {
  toNodeHandler(auth)(req, res).catch(next)
})

app.use(express.json({ limit: '50kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user, session: req.session })
})

app.use('/api/users', usersRouter)
app.use('/webhooks', webhookRouter)
app.use('/api/tickets', ticketsRouter)

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
app.use(errorHandler)

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
