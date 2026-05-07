import type { RequestHandler } from "express"
import { Role } from "../generated/prisma/enums.js"

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, res, next) => {
    const userRole = (req.user as { role?: Role } | undefined)?.role
    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ error: "Forbidden" })
      return
    }
    next()
  }
}
