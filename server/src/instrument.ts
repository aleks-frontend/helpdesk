import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV ?? 'development',

  // Capture 100% of transactions in development; tune down in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only send events when a DSN is configured (keeps local dev quiet)
  enabled: Boolean(process.env.SENTRY_DSN),
})
