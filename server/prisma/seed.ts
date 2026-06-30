import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Role } from "../src/generated/prisma/client.js"
import { hashPassword } from "better-auth/crypto"

const AI_AGENT_EMAIL = 'ai@helpdesk.internal'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env")
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user already exists: ${email}`)
  } else {
    const id = crypto.randomUUID()
    const hashed = await hashPassword(password)

    await prisma.user.create({
      data: {
        id,
        name: "Admin",
        email,
        emailVerified: true,
        role: Role.admin,
        createdAt: new Date(),
        updatedAt: new Date(),
        accounts: {
          create: {
            id: crypto.randomUUID(),
            accountId: id,
            providerId: "credential",
            password: hashed,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
    })

    console.log(`Created admin user: ${email}`)
  }

  const existingAiAgent = await prisma.user.findUnique({ where: { email: AI_AGENT_EMAIL } })
  if (existingAiAgent) {
    console.log(`AI agent already exists: ${AI_AGENT_EMAIL}`)
  } else {
    const agent = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: 'AI',
        email: AI_AGENT_EMAIL,
        emailVerified: true,
        role: Role.agent,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    console.log(`Created AI agent: ${agent.email}`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
