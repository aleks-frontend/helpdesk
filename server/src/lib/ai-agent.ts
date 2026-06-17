import { prisma } from './prisma.js'

/** Email used by the seed-ai-agent script — never changes after seeding. */
export const AI_AGENT_EMAIL = 'ai@helpdesk.internal'

// Cached per process-lifetime; the AI agent row is immutable after seeding.
let cachedId: string | null | undefined

/**
 * Returns the User.id of the AI agent, or null if the seed has not been run yet.
 * Logs a warning on the first call if the agent is absent so the gap is visible.
 */
export async function getAiAgentId(): Promise<string | null> {
  if (cachedId !== undefined) return cachedId

  const agent = await prisma.user.findUnique({
    where: { email: AI_AGENT_EMAIL },
    select: { id: true },
  })

  if (!agent) {
    console.warn(
      '[ai-agent] AI agent not found — run "npm run db:seed:ai-agent" to create it.',
    )
  }

  cachedId = agent?.id ?? null
  return cachedId
}
