import { type NextRequest, NextResponse } from "next/server"
import { sendNewsletterEmail } from "@/lib/mailer/newsletter-mailer"
import { signUnsubToken } from "@/lib/mailer/unsub"

interface SendTestRequest {
  to?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: SendTestRequest = await request.json().catch(() => ({}))
    const testEmail = body.to || 'test@example.com'

    console.log(`[RELAY-TEST-SEND] Starting test email send to ${testEmail}`)

    // Validate email format
    if (!testEmail.includes('@')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid email format',
      }, { status: 400 })
    }

    // Generate dummy unsubscribe token
    const unsubscribeToken = signUnsubToken(testEmail)

    // Test email content
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>SMTP Relay Test Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #0a7db3; margin-top: 0;">✓ SMTP Relay Test Successful</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            This is a test email from your <strong>Discipline Rift</strong> newsletter system.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            If you're reading this, your SMTP Relay configuration is working correctly!
          </p>
          <div style="background: #e8f6fb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #0a7db3;">
              <strong>Test Details:</strong><br>
              Provider: Workspace SMTP Relay<br>
              Time: ${new Date().toISOString()}<br>
              Recipient: ${testEmail}
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">
            You can now proceed with sending your newsletter campaign with confidence.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            This is a test email from Discipline Rift Newsletter System
          </p>
        </div>
      </body>
      </html>
    `

    const plainText = `
SMTP Relay Test Successful

This is a test email from your Discipline Rift newsletter system.

If you're reading this, your SMTP Relay configuration is working correctly!

Test Details:
- Provider: Workspace SMTP Relay
- Time: ${new Date().toISOString()}
- Recipient: ${testEmail}

You can now proceed with sending your newsletter campaign with confidence.
    `

    // Send test email using relay provider
    console.log('[RELAY-TEST-SEND] Sending email...')
    
    const result = await sendNewsletterEmail({
      to: testEmail,
      subject: 'SMTP Relay Test - Discipline Rift',
      html: testHtml,
      text: plainText,
      fromName: 'Discipline Rift',
      fromEmail: process.env.RELAY_USER || 'luis@disciplinerift.com',
      unsubscribeToken,
      provider: 'relay',
    })

    const duration = ((Date.now() - startTime) / 1000).toFixed(2)

    if (result.success) {
      console.log(`[RELAY-TEST-SEND] Email sent successfully in ${duration}s`)
      console.log(`[RELAY-TEST-SEND] Message ID: ${result.messageId}`)

      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        messageId: result.messageId,
        to: testEmail,
        provider: 'relay',
        duration: `${duration}s`,
        recommendation: 'Check your inbox (and spam folder) to confirm delivery',
      })
    } else {
      console.error(`[RELAY-TEST-SEND] Email failed after ${duration}s:`, result.error)

      return NextResponse.json({
        success: false,
        message: 'Failed to send test email',
        error: result.error,
        to: testEmail,
        provider: 'relay',
        duration: `${duration}s`,
        recommendation: result.error?.includes('421') 
          ? 'Error 421: SMTP Relay not yet active. Wait 15-30 more minutes and try again.'
          : 'Check the error message and your SMTP configuration',
      }, { status: 500 })
    }

  } catch (error: any) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error(`[RELAY-TEST-SEND] Unexpected error after ${duration}s:`, error)

    return NextResponse.json({
      success: false,
      message: 'Unexpected error sending test email',
      error: error.message,
      duration: `${duration}s`,
    }, { status: 500 })
  }
}





