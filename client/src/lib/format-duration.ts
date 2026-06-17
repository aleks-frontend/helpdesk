const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Formats a duration in milliseconds as a short human-readable string, e.g. "2d 3h", "5h 12m", "<1m". */
export function formatDuration(ms: number): string {
  if (ms < MINUTE) return '<1m'

  const days = Math.floor(ms / DAY)
  const hours = Math.floor((ms % DAY) / HOUR)
  const minutes = Math.floor((ms % HOUR) / MINUTE)

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}
