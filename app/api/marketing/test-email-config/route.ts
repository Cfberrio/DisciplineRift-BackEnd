import { type NextRequest, NextResponse } from "next/server"
import { verifyEmailConfiguration } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST] Testing email configuration...')
    
    // Verificar variables de entorno
    const hasGmailUser = !!process.env.GMAIL_USER
    const hasGmailPassword = !!process.env.GMAIL_APP_PASSWORD
    
    console.log('[TEST] Environment variables:', {
      hasGmailUser,
      hasGmailPassword,
      gmailUser: hasGmailUser ? process.env.GMAIL_USER : 'NOT_SET'
    })
    
    if (!hasGmailUser || !hasGmailPassword) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasGmailUser,
          hasGmailPassword
        }
      }, { status: 500 })
    }
    
    // Verificar conexión
    const verification = await verifyEmailConfiguration()
    
    return NextResponse.json({
      success: verification.success,
      message: verification.message || 'Email configuration verified',
      envCheck: {
        hasGmailUser,
        hasGmailPassword,
        gmailUser: process.env.GMAIL_USER
      }
    })
    
  } catch (error) {
    console.error('[TEST] Error testing email config:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}








