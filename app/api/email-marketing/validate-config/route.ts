import { type NextRequest, NextResponse } from "next/server"
import { verifyTransport, type SmtpProvider } from "@/lib/mailer/providers"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const provider = (searchParams.get('provider') as SmtpProvider) || 'relay'

    console.log(`[VALIDATE] Checking configuration for provider: ${provider}`)

    // Check environment variables
    const envCheck: Record<string, boolean> = {}
    
    if (provider === 'relay') {
      envCheck['RELAY_HOST'] = !!process.env.RELAY_HOST
      envCheck['RELAY_PORT'] = !!process.env.RELAY_PORT
      envCheck['RELAY_USER'] = !!process.env.RELAY_USER
      envCheck['RELAY_PASS'] = !!process.env.RELAY_PASS
      envCheck['RELAY_REQUIRE_TLS'] = !!process.env.RELAY_REQUIRE_TLS
    } else if (provider === 'gmail') {
      envCheck['GMAIL_HOST'] = !!process.env.GMAIL_HOST
      envCheck['GMAIL_PORT'] = !!process.env.GMAIL_PORT
      envCheck['GMAIL_USER'] = !!process.env.GMAIL_USER
      envCheck['GMAIL_APP_PASSWORD'] = !!process.env.GMAIL_APP_PASSWORD
    } else if (provider === 'marketing') {
      envCheck['SMTP_MKT_HOST'] = !!process.env.SMTP_MKT_HOST
      envCheck['SMTP_MKT_PORT'] = !!process.env.SMTP_MKT_PORT
      envCheck['SMTP_MKT_USER'] = !!process.env.SMTP_MKT_USER
      envCheck['SMTP_MKT_PASS'] = !!process.env.SMTP_MKT_PASS
      envCheck['SMTP_MKT_REQUIRE_TLS'] = !!process.env.SMTP_MKT_REQUIRE_TLS
    }

    // Check for missing variables
    const missing = Object.entries(envCheck)
      .filter(([_, exists]) => !exists)
      .map(([key]) => key)

    if (missing.length > 0) {
      console.error(`[VALIDATE] Missing environment variables: ${missing.join(', ')}`)
      return NextResponse.json({
        success: false,
        provider,
        message: `Missing environment variables: ${missing.join(', ')}`,
        environmentVariables: envCheck,
        smtpConnectionTest: null,
      })
    }

    console.log('[VALIDATE] All environment variables present, testing SMTP connection...')

    // Test SMTP connection
    const smtpTest = await verifyTransport(provider)

    if (!smtpTest.success) {
      console.error(`[VALIDATE] SMTP connection failed: ${smtpTest.message}`)
      return NextResponse.json({
        success: false,
        provider,
        message: 'SMTP connection test failed',
        environmentVariables: envCheck,
        smtpConnectionTest: {
          success: false,
          error: smtpTest.message,
          code: smtpTest.code,
        },
      })
    }

    console.log('[VALIDATE] Configuration validated successfully')

    return NextResponse.json({
      success: true,
      provider,
      message: `${provider} provider is configured and ready`,
      environmentVariables: envCheck,
      smtpConnectionTest: {
        success: true,
        message: smtpTest.message,
      },
    })

  } catch (error) {
    console.error('[VALIDATE] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to validate configuration", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}











