import { PgBoss } from 'pg-boss'

// Strip Prisma-specific query params pg-boss doesn't understand
const connectionString = process.env.DATABASE_URL!.split('?')[0]

export const boss = new PgBoss(connectionString)
boss.on('error', (err: unknown) => console.error('[pg-boss]', err))
