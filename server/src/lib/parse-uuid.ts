import type { Response } from 'express'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parseUUID(raw: unknown, res: Response, label = 'ID'): string | null {
  const id = String(raw)
  if (!UUID_RE.test(id)) {
    res.status(400).json({ error: `Invalid ${label}` })
    return null
  }
  return id
}
