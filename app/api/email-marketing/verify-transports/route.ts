import { type NextRequest, NextResponse } from "next/server"
import { verifyTransports } from "@/lib/mailer/providers"

/**
 * Verify both Gmail and Relay SMTP transports
 * GET /api/email-marketing/verify-transports
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Starting transport verification...')
    
    // This will log to console: [MAIL][gmail] OK/FAIL and [MAIL][relay] OK/FAIL
    await verifyTransports()
    
    return NextResponse.json({
      success: true,
      message: 'Transport verification completed. Check server logs for details.',
    })
  } catch (error) {
    console.error('Error during transport verification:', error)
    return NextResponse.json(
      {
        error: 'Transport verification failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


