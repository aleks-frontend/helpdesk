import { Router } from 'express'
import { hashPassword } from 'better-auth/crypto'
import { requireAuth } from '../middleware/require-auth.js'
import { requireRole } from '../middleware/require-role.js'
import { prisma } from '../lib/prisma.js'
import { Role } from '../generated/prisma/enums.js'
import { createUserSchema, updateUserSchema } from 'core'
import { validateBody } from '../lib/validate-body.js'

export const usersRouter = Router()

usersRouter.get('/', requireAuth, requireRole(Role.admin), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ users })
})

usersRouter.post('/', requireAuth, requireRole(Role.admin), async (req, res) => {
  const data = validateBody(createUserSchema, req.body, res)
  if (!data) return

  const { name, email, password } = data

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

usersRouter.patch('/:id', requireAuth, requireRole(Role.admin), async (req, res) => {
  const id = req.params['id'] as string
  const data = validateBody(updateUserSchema, req.body, res)
  if (!data) return

  const { name, email, role, password } = data

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) {
    res.status(404).json({ error: 'User not found.' })
    return
  }

  if (email !== existing.email) {
    const emailTaken = await prisma.user.findUnique({ where: { email } })
    if (emailTaken) {
      res.status(409).json({ error: 'A user with that email already exists.' })
      return
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: { name, email, role: role as Role, updatedAt: new Date() },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  if (password) {
    const hashed = await hashPassword(password)
    await prisma.account.updateMany({
      where: { userId: id, providerId: 'credential' },
      data: { password: hashed, updatedAt: new Date() },
    })
  }

  res.json({ user })
})
