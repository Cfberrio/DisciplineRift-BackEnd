import { convert } from 'html-to-text'
import { createTransporter, type SmtpProvider } from './providers'
import { signUnsubToken } from './unsub'

function maskEmail(email: string) {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return email
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`
  }
  return `${localPart[0]}***${localPart.slice(-1)}@${domain}`
}

export interface NewsletterEmailOptions {
  to: string
  subject: string
  html: string
  text: string
  fromName: string
  fromEmail: string
  unsubscribeToken: string
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
    const baseUrl = process.env.APP_BASE_URL || process.env.UNSUBSCRIBE_URL_BASE || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const unsubscribeUrl = `${baseUrl}/api/email-marketing/unsubscribe?token=${options.unsubscribeToken}`
    const unsubscribeMailto = `mailto:unsubscribe@disciplinerift.com?subject=unsubscribe`
    const viewInBrowserUrl = `${baseUrl}/newsletter/view?token=${options.unsubscribeToken}`
    
    // Log placeholder replacement for debugging
    const hasUnsubscribePlaceholder = options.html.includes('{UNSUBSCRIBE_URL}')
    const hasViewInBrowserPlaceholder = options.html.includes('{VIEW_IN_BROWSER_URL}')
    
    console.log(`[NEWSLETTER] Processing email`, {
      recipient: maskEmail(options.to),
      hasUnsubscribePlaceholder,
      hasViewInBrowserPlaceholder,
      baseUrl,
      htmlLength: options.html.length,
    })
    
    // Replace placeholders in HTML
    let emailHtml = options.html
      .replace(/{UNSUBSCRIBE_URL}/g, unsubscribeUrl)
      .replace(/{VIEW_IN_BROWSER_URL}/g, viewInBrowserUrl)
    
    // Log if placeholders were not replaced (potential issue)
    if (emailHtml.includes('{UNSUBSCRIBE_URL}') || emailHtml.includes('{VIEW_IN_BROWSER_URL}')) {
      console.warn(`[NEWSLETTER] Warning: Some placeholders were not replaced in HTML for ${options.to}`, {
        stillHasUnsubscribe: emailHtml.includes('{UNSUBSCRIBE_URL}'),
        stillHasViewInBrowser: emailHtml.includes('{VIEW_IN_BROWSER_URL}'),
      })
    }
    
    // Ensure unsubscribe link is in the HTML body (only if not already present)
    if (!emailHtml.toLowerCase().includes('unsubscribe')) {
      console.log(`[NEWSLETTER] Adding unsubscribe link to email for ${options.to}`)
      // Add unsubscribe link at the bottom if not present
      emailHtml += `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
          <p>Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color: #0066cc;">Unsubscribe</a></p>
        </div>
      `
    }
    
    // Convert HTML to plain text if not provided
    const basePlainText = options.text || convert(emailHtml, {
      wordwrap: 80,
      preserveNewlines: true,
      selectors: [
        { selector: 'a', options: { ignoreHref: false } },
        { selector: 'img', format: 'skip' }
      ]
    })
    const plainText = basePlainText.includes('Unsubscribe')
      ? basePlainText
      : `${basePlainText}\n\nUnsubscribe: ${unsubscribeUrl}`

    const info = await transporter.sendMail({
      from: `"${options.fromName}" <${options.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: emailHtml,
      text: plainText,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'List-ID': 'Newsletter.DisciplineRift',
        'Reply-To': options.fromEmail,
        'X-Mailer': 'DisciplineRift Newsletter System',
        'Organization': 'Discipline Rift',
        'Precedence': 'bulk',
      },
    })
    
    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error: any) {
    const errorCode = error.code || error.responseCode
    const errorMessage = error.message || 'Unknown error'
    
    console.error(`[NEWSLETTER] Send failed: Code=${errorCode}, Message=${errorMessage}`)
    
    // Check for auth errors - don't retry
    if (errorCode === 'EAUTH' || errorCode === 535) {
      console.error('[NEWSLETTER] Authentication error - aborting retries')
      return {
        success: false,
        error: 'Authentication failed: Check RELAY_PASS is a valid App Password',
      }
    }
    
    // Check for SMTP Relay not ready (421) - special handling
    if (errorCode === 421 || errorCode === 'ECONNECTION') {
      console.warn('[NEWSLETTER] Error 421: SMTP Relay not ready or connection refused')
      
      // For error 421, use longer delays
      const longDelays = [15000, 30000, 60000] // 15s, 30s, 60s
      
      if (retryCount < maxRetries) {
        const delay = longDelays[retryCount]
        console.log(`[NEWSLETTER] SMTP Relay propagation in progress. Retry ${retryCount + 1}/${maxRetries} after ${delay / 1000}s`)
        console.log('[NEWSLETTER] Tip: If just enabled, SMTP Relay can take 30-60 minutes to activate')
        await new Promise(resolve => setTimeout(resolve, delay))
        return sendNewsletterEmail(options, retryCount + 1)
      }
      
      return {
        success: false,
        error: 'SMTP Relay not ready (Error 421). Service may still be propagating. Wait 30-60 minutes after enabling in Google Admin Console.',
      }
    }
    
    // Standard retry logic for other errors
    if (retryCount < maxRetries) {
      const delay = delays[retryCount]
      console.log(`[NEWSLETTER] Retry ${retryCount + 1}/${maxRetries} after ${delay}ms`)
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
  const batchSize = parseInt(process.env.BATCH_SIZE || '100')
  const concurrency = parseInt(process.env.CONCURRENCY || '5')
  const delayBetweenBatches = parseInt(process.env.DELAY_BETWEEN_BATCH_MS || '3000')
  
  console.log(`[NEWSLETTER] Starting batch send: ${options.recipients.length} recipients`)
  console.log(`[NEWSLETTER] Config: batch=${batchSize}, concurrency=${concurrency}, delay=${delayBetweenBatches}ms`)
  console.log(`[NEWSLETTER] Email details:`, {
    subject: options.subject,
    fromName: options.fromName,
    fromEmail: options.fromEmail,
    htmlLength: options.html.length,
    textLength: options.text.length,
    provider: options.provider || 'gmail',
  })
  
  if (options.recipients.length === 0) {
    console.error('[NEWSLETTER] No recipients provided')
    return {
      total: 0,
      sent: 0,
      failed: 0,
      errors: [{ email: 'N/A', error: 'No recipients provided' }],
    }
  }
  
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
    const batchNumber = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(options.recipients.length / batchSize)
    
    console.log(`[NEWSLETTER] Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`)
    
    // Process batch with concurrency limit
    const chunks: Array<Array<typeof batch[0]>> = []
    for (let j = 0; j < batch.length; j += concurrency) {
      chunks.push(batch.slice(j, j + concurrency))
    }
    
    for (const chunk of chunks) {
      const chunkNumber = chunks.indexOf(chunk) + 1
      const totalChunks = chunks.length
      console.log(`[NEWSLETTER] Processing chunk ${chunkNumber}/${totalChunks} of batch ${batchNumber} (${chunk.length} emails)`)
      
      const promises = chunk.map(async (recipient) => {
        try {
          const token = signUnsubToken(recipient.email)
          
          const sendResult = await sendNewsletterEmail({
            to: recipient.email,
            subject: options.subject,
            html: options.html,
            text: options.text,
            fromName: options.fromName,
            fromEmail: options.fromEmail,
            unsubscribeToken: token,
            provider: options.provider,
          })
          
          if (sendResult.success) {
            result.sent++
            // Log progress every 100 emails
            if (result.sent % 100 === 0) {
              console.log(`[NEWSLETTER] Progress: ${result.sent}/${options.recipients.length} sent (${result.failed} failed)`)
            }
          } else {
            result.failed++
            const errorMsg = sendResult.error || 'Unknown error'
            result.errors.push({
              email: recipient.email,
              error: errorMsg,
            })
            // Only log first 10 errors to avoid spam
            if (result.errors.length <= 10) {
              console.error(`[NEWSLETTER] Failed to send to ${recipient.email}: ${errorMsg}`)
            }
          }
        } catch (error) {
          result.failed++
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push({
            email: recipient.email,
            error: errorMsg,
          })
          // Only log first 10 errors to avoid spam
          if (result.errors.length <= 10) {
            console.error(`[NEWSLETTER] Exception sending to ${recipient.email}:`, errorMsg)
          }
        }
      })
      
      await Promise.all(promises)
      
      // Log chunk completion
      if (chunkNumber < totalChunks) {
        console.log(`[NEWSLETTER] Chunk ${chunkNumber}/${totalChunks} completed. Progress: ${result.sent} sent, ${result.failed} failed`)
      }
    }
    
    // Delay between batches (except for the last batch)
    if (i + batchSize < options.recipients.length) {
      console.log(`[NEWSLETTER] Waiting ${delayBetweenBatches}ms before next batch...`)
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
    }
  }
  
  console.log(`[NEWSLETTER] Batch send completed: ${result.sent} sent, ${result.failed} failed`)
  
  if (result.failed > 0) {
    console.warn(`[NEWSLETTER] ${result.failed} emails failed to send. First 10 errors:`, 
      result.errors.slice(0, 10).map(e => `${e.email}: ${e.error}`)
    )
  }
  
  if (result.sent === 0 && result.total > 0) {
    console.error('[NEWSLETTER] CRITICAL: No emails were sent successfully!', {
      total: result.total,
      failed: result.failed,
      errors: result.errors.slice(0, 5),
    })
  }

  
  return result
}

/**
 * Verify email configuration for a specific provider
 */
export async function verifyNewsletterEmailConfig(
  provider?: SmtpProvider
): Promise<{ success: boolean; message: string }> {
  const selectedProvider = provider || 'gmail'
  console.log(`[NEWSLETTER] Verifying email configuration for provider: ${selectedProvider}`)
  
  try {
    const transporter = createNewsletterTransporter(provider)
    console.log(`[NEWSLETTER] Testing SMTP connection for ${selectedProvider}...`)
    await transporter.verify()
    console.log(`[NEWSLETTER] Email configuration verified successfully for ${selectedProvider}`)
    return {
      success: true,
      message: `Email configuration verified for ${selectedProvider}`,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = (error as any)?.code || (error as any)?.responseCode || 'N/A'
    
    console.error(`[NEWSLETTER] Email configuration verification failed for ${selectedProvider}:`, {
      error: errorMessage,
      code: errorCode,
      provider: selectedProvider,
    })
    
    // Provide more helpful error messages
    let userMessage = errorMessage
    if (errorCode === 'EAUTH' || errorCode === 535) {
      userMessage = `Authentication failed for ${selectedProvider}. Please check your credentials (App Password for Gmail or Relay credentials).`
    } else if (errorCode === 421 || errorCode === 'ECONNECTION') {
      userMessage = `SMTP Relay not ready (Error 421). If you just enabled it, wait 30-60 minutes for propagation.`
    }
    
    return {
      success: false,
      message: userMessage,
    }
  }
}

