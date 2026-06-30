import sgMail from '@sendgrid/mail'

const apiKey = process.env.SENDGRID_API_KEY
const fromEmail = process.env.SENDGRID_FROM_EMAIL
const fromName = process.env.SENDGRID_FROM_NAME

if (apiKey) {
  sgMail.setApiKey(apiKey)
  console.log(`[email] SendGrid configured, from=${fromEmail}`)
} else {
  console.warn('[email] SENDGRID_API_KEY not set — outbound email disabled')
}

interface SendReplyEmailOptions {
  to: string
  toName: string
  subject: string
  body: string
  bodyHtml?: string | null
}

export async function sendReplyEmail(opts: SendReplyEmailOptions): Promise<void> {
  if (!apiKey || !fromEmail) {
    console.warn('[email] SENDGRID_API_KEY or SENDGRID_FROM_EMAIL not set — skipping')
    return
  }

  const from = fromName ? { email: fromEmail, name: fromName } : fromEmail

  await sgMail.send({
    to: { email: opts.to, name: opts.toName },
    from,
    subject: `Re: ${opts.subject}`,
    text: opts.body,
    ...(opts.bodyHtml && { html: opts.bodyHtml }),
  })
}
