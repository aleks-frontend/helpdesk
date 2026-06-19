import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,

  // Capture 100% of transactions in development; tune down in production
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

  // Only send events when a DSN is configured (keeps local dev quiet)
  enabled: Boolean(import.meta.env.VITE_SENTRY_DSN),

  // Proxy events through our server so ad blockers don't intercept them
  tunnel: '/api/sentry-tunnel',

  // Log Sentry activity to the browser console (remove once confirmed working)
  debug: !import.meta.env.PROD,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Mask all text and block all media by default in session replay
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Capture 10% of sessions for replay in production
  replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
  replaysOnErrorSampleRate: 1.0,
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>Something went wrong.</p>} showDialog>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
