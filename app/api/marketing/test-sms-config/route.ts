import { type NextRequest, NextResponse } from "next/server"
import { verifySMSConfiguration } from "@/lib/sms-service"

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST] Testing SMS configuration...')
    
    // Verificar variables de entorno
    const hasTwilioSid = !!process.env.TWILIO_ACCOUNT_SID
    const hasTwilioToken = !!process.env.TWILIO_AUTH_TOKEN
    const hasTwilioPhone = !!process.env.TWILIO_PHONE_NUMBER
    
    console.log('[TEST] Environment variables:', {
      hasTwilioSid,
      hasTwilioToken,
      hasTwilioPhone,
      twilioPhone: hasTwilioPhone ? process.env.TWILIO_PHONE_NUMBER : 'NOT_SET'
    })
    
    if (!hasTwilioSid || !hasTwilioToken || !hasTwilioPhone) {
      return NextResponse.json({
        success: false,
        error: 'Missing Twilio environment variables',
        details: {
          hasTwilioSid,
          hasTwilioToken,
          hasTwilioPhone
        }
      }, { status: 500 })
    }
    
    // Verificar configuración
    const verification = await verifySMSConfiguration()
    
    return NextResponse.json({
      success: verification.success,
      message: verification.message || 'SMS configuration verified',
      envCheck: {
        hasTwilioSid,
        hasTwilioToken,
        hasTwilioPhone,
        twilioPhone: process.env.TWILIO_PHONE_NUMBER
      }
    })
    
  } catch (error) {
    console.error('[TEST] Error testing SMS config:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}




