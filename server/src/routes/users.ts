import { Router } from 'express'
import { hashPassword } from 'better-auth/crypto'
import { requireAuth } from '../middleware/require-auth.js'
import { requireRole } from '../middleware/require-role.js'
import { prisma } from '../lib/prisma.js'
import { Role } from '../generated/prisma/enums.js'
import { createUserSchema } from 'core'

export const usersRouter = Router()

usersRouter.get('/', requireAuth, requireRole(Role.admin), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ users })
})

usersRouter.post('/', requireAuth, requireRole(Role.admin), async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Invalid input.'
    res.status(400).json({ error: message })
    return
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ error: 'A user with that email already exists.' })
    return
  }

  const id = crypto.randomUUID()
  const hashed = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      emailVerified: true,
      role: Role.agent,
      createdAt: new Date(),
      updatedAt: new Date(),
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: id,
          providerId: 'credential',
          password: hashed,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  res.status(201).json({ user })
})
