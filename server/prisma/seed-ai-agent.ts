import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '../src/generated/prisma/client.js'

// Well-known internal identity used to represent the AI auto-resolve pipeline.
// Not a real login — no account / password row is created.
export const AI_AGENT_EMAIL = 'ai@helpdesk.internal'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: AI_AGENT_EMAIL } })
  if (existing) {
    console.log(`AI agent already exists: ${AI_AGENT_EMAIL} (id: ${existing.id})`)
    return
  }

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

  console.log(`Created AI agent: ${agent.email} (id: ${agent.id})`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
