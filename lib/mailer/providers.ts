import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

export type SmtpProvider = 'gmail' | 'relay' | 'marketing'

/**
 * Create email transporter based on provider
 * @param provider - 'gmail' (default, ≤500/day), 'relay' (Workspace SMTP Relay for bulk), or 'marketing' (custom SMTP for marketing)
 */
export function createTransporter(
  provider: SmtpProvider = (process.env.SMTP_PROVIDER_DEFAULT as SmtpProvider) || 'gmail'
): Transporter {
  if (provider === 'marketing') {
    // Custom Marketing SMTP (for newsletter campaigns)
    const marketingHost = process.env.SMTP_MKT_HOST
    const marketingPort = Number(process.env.SMTP_MKT_PORT) || 587
    const marketingUser = process.env.SMTP_MKT_USER
    const marketingPass = process.env.SMTP_MKT_PASS

    if (!marketingHost || !marketingUser || !marketingPass) {
      throw new Error('Marketing SMTP credentials not configured. Set SMTP_MKT_HOST, SMTP_MKT_USER and SMTP_MKT_PASS.')
    }

    return nodemailer.createTransport({
      host: marketingHost,
      port: marketingPort,
      secure: false,
      requireTLS: process.env.SMTP_MKT_REQUIRE_TLS === 'true',
      auth: {
        user: marketingUser,
        pass: (marketingPass || '').replace(/\s+/g, ''), // Remove whitespace
      },
    })
  }

  if (provider === 'relay') {
    // Google Workspace SMTP Relay (for bulk sending)
    const relayHost = process.env.RELAY_HOST || 'smtp-relay.gmail.com'
    const relayPort = Number(process.env.RELAY_PORT) || 587
    const relayUser = process.env.RELAY_USER
    const relayPass = process.env.RELAY_PASS
    const requireTLS = String(process.env.RELAY_REQUIRE_TLS) === 'true' || true

    console.log('[PROVIDER][relay] Creating SMTP Relay transporter...')
    console.log(`[PROVIDER][relay] Host: ${relayHost}`)
    console.log(`[PROVIDER][relay] Port: ${relayPort}`)
    console.log(`[PROVIDER][relay] User: ${relayUser}`)
    console.log(`[PROVIDER][relay] Pass: ${relayPass ? '***SET*** (length: ' + relayPass.length + ')' : 'NOT SET'}`)
    console.log(`[PROVIDER][relay] RequireTLS: ${requireTLS}`)

    if (!relayUser || !relayPass) {
      console.error('[PROVIDER][relay] ERROR: Missing credentials')
      throw new Error('Relay SMTP credentials not configured. Set RELAY_USER and RELAY_PASS.')
    }

    const cleanPass = relayPass.replace(/\s+/g, '')
    if (cleanPass !== relayPass) {
      console.log('[PROVIDER][relay] Removed whitespace from password')
    }

    console.log('[PROVIDER][relay] Transporter configuration complete')

    return nodemailer.createTransport({
      host: relayHost,
      port: relayPort,
      secure: false, // false for port 587
      requireTLS,
      auth: {
        user: relayUser,
        pass: cleanPass,
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
  const providers: SmtpProvider[] = ['gmail', 'relay', 'marketing']

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
  console.log(`[PROVIDER][${provider}] Starting verification...`)
  try {
    const transporter = createTransporter(provider)
    console.log(`[PROVIDER][${provider}] Transporter created, attempting verify()...`)
    await transporter.verify()
    console.log(`[PROVIDER][${provider}] ✓ Verification successful`)
    return {
      success: true,
      message: `${provider} transport verified successfully`,
    }
  } catch (error: any) {
    const errorCode = error?.code || error?.responseCode || 'UNKNOWN'
    const errorMessage = error?.message || 'Unknown error'
    const errorResponse = error?.response || ''
    
    console.error(`[PROVIDER][${provider}] ✗ Verification failed`)
    console.error(`[PROVIDER][${provider}] Error code: ${errorCode}`)
    console.error(`[PROVIDER][${provider}] Error message: ${errorMessage}`)
    if (errorResponse) {
      console.error(`[PROVIDER][${provider}] Error response: ${errorResponse}`)
    }
    
    return {
      success: false,
      message: errorMessage,
      code: errorCode?.toString(),
    }
  }
}


