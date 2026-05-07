import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { Role } from "../generated/prisma/enums.js"
import { prisma } from "./prisma.js"

export const auth = betterAuth({
  basePath: "/api/auth",
  trustedOrigins: (() => {
    const raw = process.env.TRUSTED_ORIGINS
    if (!raw) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('TRUSTED_ORIGINS environment variable must be set in production')
      }
      return ['http://localhost:5173']
    }
    return raw.split(',')
  })(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: Role.agent,
      },
    },
  },
})
