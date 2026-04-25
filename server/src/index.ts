import express from 'express'

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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
