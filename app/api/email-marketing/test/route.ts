import { type NextRequest, NextResponse } from "next/server"
import { sendNewsletterEmail, verifyNewsletterEmailConfig } from "@/lib/mailer/newsletter-mailer"
import { signUnsubToken } from "@/lib/mailer/unsub"
import type { SmtpProvider } from "@/lib/mailer/providers"

interface TestEmailRequest {
  subject: string
  from_name: string
  from_email: string
  html: string
  text_alt: string
  test_emails: string[]
  provider?: SmtpProvider // Optional: 'gmail' (default) or 'relay'
}

export async function POST(request: NextRequest) {
  try {
    const body: TestEmailRequest = await request.json()
    const { subject, from_name, from_email, html, text_alt, test_emails, provider } = body

    // Validate input
    if (!subject || !from_name || !from_email || !html || !test_emails || test_emails.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Use specified provider or default to 'gmail'
    const selectedProvider = provider || 'gmail'

    // Verify email configuration for selected provider
    const configCheck = await verifyNewsletterEmailConfig(selectedProvider)
    if (!configCheck.success) {
      return NextResponse.json(
        { error: "Email configuration error", details: configCheck.message },
        { status: 500 }
      )
    }

    const results = []
    const dummyToken = signUnsubToken('test@example.com')

    for (const email of test_emails) {
      // Validate email format
      if (!email || !email.includes('@')) {
        results.push({
          email,
          success: false,
          error: 'Invalid email format',
        })
        continue
      }

      const result = await sendNewsletterEmail({
        to: email,
        subject: `[TEST] ${subject}`,
        html,
        text: text_alt || html.replace(/<[^>]*>/g, ''),
        fromName: from_name,
        fromEmail: from_email,
        unsubscribeToken: dummyToken,
        provider: selectedProvider,
      })

      results.push({
        email,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      })
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Test emails sent: ${successCount} successful, ${failureCount} failed`,
      statistics: {
        total: results.length,
        sent: successCount,
        failed: failureCount,
      },
      results,
    })

  } catch (error) {
    console.error("Error sending test emails:", error)
    return NextResponse.json(
      { error: "Failed to send test emails", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

