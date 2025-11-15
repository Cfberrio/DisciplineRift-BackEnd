import nodemailer from 'nodemailer'
import crypto from 'crypto'
import { createTransporter, type SmtpProvider } from './providers'

export interface NewsletterEmailOptions {
  to: string
  subject: string
  html: string
  text: string
  fromName: string
  fromEmail: string
  unsubscribeUrl: string
  provider?: SmtpProvider
}

export interface BatchSendOptions {
  subject: string
  html: string
  text: string
  fromName: string
  fromEmail: string
  recipients: Array<{ email: string; name?: string }>
  provider?: SmtpProvider
}

export interface BatchSendResult {
  total: number
  sent: number
  failed: number
  errors: Array<{ email: string; error: string }>
}

// Create email transporter using provider factory
// Defaults to 'gmail' for backward compatibility
function createNewsletterTransporter(provider?: SmtpProvider) {
  return createTransporter(provider || 'gmail')
}

/**
 * Generate unsubscribe token from email
 * Token = base64(email:timestamp:hmac)
 */
export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-in-production'
  const timestamp = Date.now().toString()
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(`${email}:${timestamp}`)
    .digest('hex')
  
  const payload = `${email}:${timestamp}:${hmac}`
  return Buffer.from(payload).toString('base64url')
}

/**
 * Verify and decode unsubscribe token
 */
export function verifyUnsubscribeToken(token: string): { email: string; valid: boolean } {
  try {
    const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret-change-in-production'
    const payload = Buffer.from(token, 'base64url').toString('utf-8')
    const [email, timestamp, hmac] = payload.split(':')
    
    if (!email || !timestamp || !hmac) {
      return { email: '', valid: false }
    }
    
    // Verify HMAC
    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(`${email}:${timestamp}`)
      .digest('hex')
    
    if (hmac !== expectedHmac) {
      return { email: '', valid: false }
    }
    
    return { email, valid: true }
  } catch (error) {
    console.error('Error verifying unsubscribe token:', error)
    return { email: '', valid: false }
  }
}

/**
 * Send a single newsletter email with retry logic
 */
export async function sendNewsletterEmail(
  options: NewsletterEmailOptions,
  retryCount = 0
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const maxRetries = 3
  const delays = [5000, 15000, 45000] // 5s, 15s, 45s
  
  try {
    const transporter = createNewsletterTransporter(options.provider)
    
    // Use UNSUBSCRIBE_URL_BASE if provided, otherwise fallback to NEXT_PUBLIC_APP_URL
    const baseUrl = process.env.UNSUBSCRIBE_URL_BASE || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const unsubscribeUrl = `${baseUrl}/api/email-marketing/unsubscribe?token=${options.unsubscribeUrl}`
    const unsubscribeMailto = `mailto:unsubscribe@disciplinerift.com?subject=unsubscribe`
    
    // Ensure unsubscribe link is in the HTML body
    let emailHtml = options.html
    if (!emailHtml.toLowerCase().includes('unsubscribe')) {
      // Add unsubscribe link at the bottom if not present
      emailHtml += `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
          <p>Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color: #0066cc;">Unsubscribe</a></p>
        </div>
      `
    }
    
    const info = await transporter.sendMail({
      from: `"${options.fromName}" <${options.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: emailHtml,
      text: options.text,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>, <${unsubscribeMailto}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'List-ID': 'Newsletter.DisciplineRift',
      },
    })
    
    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    // Check for auth errors - don't retry
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('Authentication error - aborting retries')
      return {
        success: false,
        error: 'Authentication failed',
      }
    }
    
    // Retry logic
    if (retryCount < maxRetries) {
      const delay = delays[retryCount]
      console.log(`Retry ${retryCount + 1}/${maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
      return sendNewsletterEmail(options, retryCount + 1)
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send emails in batches with concurrency control
 */
export async function sendBatchNewsletters(
  options: BatchSendOptions
): Promise<BatchSendResult> {
  const batchSize = parseInt(process.env.BATCH_SIZE || '50')
  const concurrency = parseInt(process.env.CONCURRENCY || '3')
  const delayBetweenBatches = parseInt(process.env.DELAY_BETWEEN_BATCH_MS || '5000')
  
  const result: BatchSendResult = {
    total: options.recipients.length,
    sent: 0,
    failed: 0,
    errors: [],
  }
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // Process in batches
  for (let i = 0; i < options.recipients.length; i += batchSize) {
    const batch = options.recipients.slice(i, i + batchSize)
    
    // Process batch with concurrency limit
    const chunks: Array<Array<typeof batch[0]>> = []
    for (let j = 0; j < batch.length; j += concurrency) {
      chunks.push(batch.slice(j, j + concurrency))
    }
    
    for (const chunk of chunks) {
      const promises = chunk.map(async (recipient) => {
        try {
          const token = generateUnsubscribeToken(recipient.email)
          
          const sendResult = await sendNewsletterEmail({
            to: recipient.email,
            subject: options.subject,
            html: options.html,
            text: options.text,
            fromName: options.fromName,
            fromEmail: options.fromEmail,
            unsubscribeUrl: token,
            provider: options.provider,
          })
          
          if (sendResult.success) {
            result.sent++
          } else {
            result.failed++
            result.errors.push({
              email: recipient.email,
              error: sendResult.error || 'Unknown error',
            })
          }
        } catch (error) {
          result.failed++
          result.errors.push({
            email: recipient.email,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      })
      
      await Promise.all(promises)
    }
    
    // Delay between batches (except for the last batch)
    if (i + batchSize < options.recipients.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
    }
  }
  
  return result
}

/**
 * Verify email configuration for a specific provider
 */
export async function verifyNewsletterEmailConfig(
  provider?: SmtpProvider
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createNewsletterTransporter(provider)
    await transporter.verify()
    return {
      success: true,
      message: `Email configuration verified for ${provider || 'gmail'}`,
    }
  } catch (error) {
    console.error('Email configuration verification failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

