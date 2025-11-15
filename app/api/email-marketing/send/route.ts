import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { sendBatchNewsletters, verifyNewsletterEmailConfig } from "@/lib/mailer/newsletter-mailer"
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
  try {
    const body: SendEmailRequest = await request.json()
    const { subject, from_name, from_email, html, text_alt, provider } = body

    // Validate input
    if (!subject || !from_name || !from_email || !html) {
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

    // Fetch all newsletter subscribers
    const supabase = createServerSupabaseClient()
    const { data: subscribers, error: dbError } = await supabase
      .from('Newsletter')
      .select('email')

    if (dbError) {
      console.error("Database error fetching subscribers:", dbError)
      return NextResponse.json(
        { error: "Failed to fetch subscribers", details: dbError.message },
        { status: 500 }
      )
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: "No subscribers found" },
        { status: 404 }
      )
    }

    // Filter valid emails and remove duplicates
    const validEmails = subscribers
      .filter(sub => sub.email && sub.email.includes('@'))
      .map(sub => ({ email: sub.email }))

    // Remove duplicates by email (case-insensitive)
    const uniqueEmails = Array.from(
      new Map(validEmails.map(item => [item.email.toLowerCase(), item])).values()
    )

    console.log(`Sending newsletter to ${uniqueEmails.length} unique subscribers using ${selectedProvider} provider`)

    // Send emails in batches with selected provider
    const result = await sendBatchNewsletters({
      subject,
      html,
      text: text_alt || html.replace(/<[^>]*>/g, ''),
      fromName: from_name,
      fromEmail: from_email,
      recipients: uniqueEmails,
      provider: selectedProvider,
    })

    console.log(`Newsletter send completed: ${result.sent} sent, ${result.failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Newsletter sent to ${result.sent} subscribers`,
      statistics: {
        total: result.total,
        sent: result.sent,
        failed: result.failed,
      },
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined, // Return first 10 errors
    })

  } catch (error) {
    console.error("Error sending newsletter:", error)
    return NextResponse.json(
      { error: "Failed to send newsletter", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

