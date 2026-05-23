import type { Response } from 'express'
import type { ZodSchema } from 'zod'

export function validateBody<T>(schema: ZodSchema<T>, body: unknown, res: Response): T | null {
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid input.'
    res.status(400).json({ error: message })
    return null
  }
  return parsed.data
}
