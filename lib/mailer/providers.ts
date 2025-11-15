import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

export type SmtpProvider = 'gmail' | 'relay'

/**
 * Create email transporter based on provider
 * @param provider - 'gmail' (default, ≤500/day) or 'relay' (Workspace SMTP Relay for bulk)
 */
export function createTransporter(
  provider: SmtpProvider = (process.env.SMTP_PROVIDER_DEFAULT as SmtpProvider) || 'gmail'
): Transporter {
  if (provider === 'relay') {
    // Google Workspace SMTP Relay (for bulk sending)
    const relayHost = process.env.RELAY_HOST || 'smtp-relay.gmail.com'
    const relayPort = Number(process.env.RELAY_PORT) || 587
    const relayUser = process.env.RELAY_USER
    const relayPass = process.env.RELAY_PASS

    if (!relayUser || !relayPass) {
      throw new Error('Relay SMTP credentials not configured. Set RELAY_USER and RELAY_PASS.')
    }

    return nodemailer.createTransport({
      host: relayHost,
      port: relayPort,
      secure: false, // false for port 587
      requireTLS: String(process.env.RELAY_REQUIRE_TLS) === 'true' || true,
      auth: {
        user: relayUser,
        pass: relayPass.replace(/\s+/g, ''), // Remove whitespace
      },
    })
  }

  // Gmail SMTP (default, for regular campaigns ≤500/day)
  const gmailHost = process.env.GMAIL_HOST || 'smtp.gmail.com'
  const gmailPort = Number(process.env.GMAIL_PORT) || 465
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPass) {
    throw new Error('Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.')
  }

  return nodemailer.createTransport({
    host: gmailHost,
    port: gmailPort,
    secure: true, // true for port 465
    auth: {
      user: gmailUser,
      pass: gmailPass.replace(/\s+/g, ''), // Remove whitespace
    },
  })
}

/**
 * Verify all configured transports
 */
export async function verifyTransports(): Promise<void> {
  const providers: SmtpProvider[] = ['gmail', 'relay']

  for (const provider of providers) {
    try {
      const transporter = createTransporter(provider)
      await transporter.verify()
      console.log(`[MAIL][${provider}] OK`)
    } catch (error: any) {
      const code = error?.code || ''
      const message = error?.message || 'Unknown error'
      console.error(`[MAIL][${provider}] FAIL`, code, message)
    }
  }
}

/**
 * Verify a specific transport
 */
export async function verifyTransport(provider: SmtpProvider): Promise<{
  success: boolean
  message: string
  code?: string
}> {
  try {
    const transporter = createTransporter(provider)
    await transporter.verify()
    return {
      success: true,
      message: `${provider} transport verified successfully`,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Unknown error',
      code: error?.code || '',
    }
  }
}


