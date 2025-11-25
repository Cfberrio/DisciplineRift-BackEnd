import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendBatchNewsletters } from "@/lib/mailer/newsletter-mailer"
import type { SmtpProvider } from "@/lib/mailer/providers"

interface SendEmailRequest {
  subject: string
  from_name: string
  from_email: string
  html: string
  text_alt: string
  provider?: SmtpProvider // Optional: 'gmail' (default) or 'relay'
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  try {
    console.log(`[API] POST /api/email-marketing/send - Started at ${timestamp}`)
    
    const body: SendEmailRequest = await request.json()
    const { subject, from_name, from_email, html, text_alt, provider } = body

    // Validate input
    if (!subject || !from_name || !from_email || !html) {
      console.error('[API] Missing required fields', {
        hasSubject: !!subject,
        hasFromName: !!from_name,
        hasFromEmail: !!from_email,
        hasHtml: !!html,
      })
      return NextResponse.json(
        { error: "Missing required fields", details: "Subject, from_name, from_email, and html are required" },
        { status: 400 }
      )
    }

    // Validate HTML content
    if (typeof html !== 'string' || html.trim().length === 0) {
      console.error('[API] Invalid HTML content')
      return NextResponse.json(
        { error: "Invalid HTML content", details: "HTML must be a non-empty string" },
        { status: 400 }
      )
    }

    // Check for required placeholders (warn but don't fail - they will be replaced automatically)
    const hasUnsubscribePlaceholder = html.includes('{UNSUBSCRIBE_URL}')
    const hasViewInBrowserPlaceholder = html.includes('{VIEW_IN_BROWSER_URL}')
    
    console.log('[API] HTML validation', {
      htmlLength: html.length,
      hasUnsubscribePlaceholder,
      hasViewInBrowserPlaceholder,
    })

    if (!hasUnsubscribePlaceholder) {
      console.warn('[API] Warning: HTML does not contain {UNSUBSCRIBE_URL} placeholder - unsubscribe link will be added automatically')
    }

    // Use specified provider or default to 'gmail'
    const selectedProvider = provider || 'gmail'
    console.log(`[API] Using provider: ${selectedProvider}`)

    // Fetch all newsletter subscribers
    console.log('[API] Fetching newsletter subscribers from database...')
    const supabase = createServerSupabaseClient()
    const { data: subscribers, error: dbError } = await supabase
      .from('Newsletter')
      .select('email')

    if (dbError) {
      console.error("[API] Database error fetching subscribers:", dbError)
      return NextResponse.json(
        { error: "Failed to fetch subscribers", details: dbError.message },
        { status: 500 }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      console.warn('[API] No subscribers found in database')
      return NextResponse.json(
        { error: "No subscribers found" },
        { status: 404 }
      )
    }

    console.log(`[API] Found ${subscribers.length} subscribers in database`)
    
    if (subscribers.length === 0) {
      console.warn('[API] No subscribers found - this may indicate a database issue')
    }

    // Filter valid emails and remove duplicates
    console.log('[API] Filtering and validating email addresses...')
    const validEmails = subscribers
      .filter(sub => {
        const isValid = sub.email && typeof sub.email === 'string' && sub.email.includes('@')
        if (!isValid) {
          console.warn(`[API] Invalid email skipped: ${JSON.stringify(sub)}`)
        }
        return isValid
      })
      .map(sub => ({ email: sub.email }))

    // Remove duplicates by email (case-insensitive)
    const uniqueEmails = Array.from(
      new Map(validEmails.map(item => [item.email.toLowerCase(), item])).values()
    )

    const invalidCount = subscribers.length - validEmails.length
    const duplicateCount = validEmails.length - uniqueEmails.length
    
    console.log(`[API] Email validation: ${uniqueEmails.length} unique, ${invalidCount} invalid, ${duplicateCount} duplicates`)
    
    if (uniqueEmails.length === 0) {
      console.error('[API] No valid email addresses found after filtering')
      return NextResponse.json(
        { error: "No valid email addresses found", details: `Found ${subscribers.length} subscribers but ${invalidCount} invalid emails` },
        { status: 400 }
      )
    }
    
    console.log(`[API] Starting newsletter send to ${uniqueEmails.length} recipients using ${selectedProvider}`)
    console.log('[API] Newsletter details:', {
      subject,
      fromName: from_name,
      fromEmail: from_email,
      htmlLength: html.length,
      provider: selectedProvider,
    })

    // Send emails in batches with selected provider
    console.log('[API] Calling sendBatchNewsletters...')
    const result = await sendBatchNewsletters({
      subject,
      html,
      text: text_alt || html.replace(/<[^>]*>/g, ''),
      fromName: from_name,
      fromEmail: from_email,
      recipients: uniqueEmails,
      provider: selectedProvider,
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`[API] Newsletter send completed in ${duration}s`)
    console.log(`[API] Final statistics: Total=${result.total}, Sent=${result.sent}, Failed=${result.failed}`)

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${result.sent} subscribers`,
      statistics: {
        total: result.total,
        sent: result.sent,
        failed: result.failed,
        duration: `${duration}s`,
      },
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined, // Return first 10 errors
    })

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error(`[API] Error sending newsletter after ${duration}s:`, error)
    return NextResponse.json(
      { error: "Failed to send newsletter", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

