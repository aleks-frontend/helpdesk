import { Router } from 'express'
import express from 'express'

export const sentryTunnelRouter = Router()

/**
 * POST /api/sentry-tunnel
 *
 * Proxies Sentry envelopes through our own domain so ad blockers that
 * intercept *.ingest.sentry.io don't prevent events from reaching Sentry.
 *
 * See: https://docs.sentry.io/platforms/javascript/troubleshooting/#using-the-tunnel-option
 */
sentryTunnelRouter.post(
  '/',
  // Sentry sends envelopes as plain text, not JSON — parse raw body here
  express.text({ type: '*/*', limit: '1mb' }),
  async (req, res) => {
    try {
      const envelope = req.body as string
      const firstLine = envelope.split('\n')[0]
      const header = JSON.parse(firstLine) as { dsn?: string }

      if (!header.dsn) {
        res.status(400).json({ error: 'Missing DSN in envelope header' })
        return
      }

      const dsn = new URL(header.dsn)
      const projectId = dsn.pathname.replace(/^\//, '')
      const upstreamUrl = `https://${dsn.host}/api/${projectId}/envelope/`

      // Safety: only forward to official Sentry ingest hosts
      if (!dsn.host.endsWith('.sentry.io')) {
        res.status(400).json({ error: 'DSN host is not a Sentry host' })
        return
      }

      const upstream = await fetch(upstreamUrl, {
        method: 'POST',
        body: envelope,
        headers: { 'Content-Type': 'application/x-sentry-envelope' },
      })

      // Mirror Sentry's status code back to the SDK
      res.status(upstream.status).end()
    } catch (err) {
      console.error('[sentry-tunnel]', err)
      res.status(500).json({ error: 'Tunnel error' })
    }
  },
)
