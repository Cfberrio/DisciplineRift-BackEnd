import { type NextRequest, NextResponse } from "next/server"
import { sendSMS } from "@/lib/sms-service"

interface SingleSMSRequest {
  phone: string
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const { phone, message }: SingleSMSRequest = await request.json()

    console.log("[DEBUG] Single SMS test request:", {
      phone: phone,
      messageLength: message?.length,
      message: message?.substring(0, 100) + '...'
    })

    // Debug: Verificar variables de entorno
    console.log("[DEBUG] Environment check:", {
      hasSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhone: !!process.env.TWILIO_PHONE_NUMBER,
      sidPrefix: process.env.TWILIO_ACCOUNT_SID?.substring(0, 2),
      sidLength: process.env.TWILIO_ACCOUNT_SID?.length,
      tokenLength: process.env.TWILIO_AUTH_TOKEN?.length
    })

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Phone and message are required" },
        { status: 400 }
      )
    }

    // Enviar SMS directamente usando el servicio
    console.log("[DEBUG] Attempting to send SMS...")
    const result = await sendSMS({
      to: phone,
      message: message
    })

    console.log("[DEBUG] SMS result:", {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      phone: result.phone
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        phone: result.phone,
        message: "SMS sent successfully"
      })
    } else {
      // Intentar parsear el error de Twilio para más detalles
      let twilioError = null
      if (result.error && typeof result.error === 'string') {
        try {
          // Buscar códigos de error de Twilio comunes
          const errorMatch = result.error.match(/(\d{5})/)
          if (errorMatch) {
            const errorCode = errorMatch[1]
            twilioError = {
              code: errorCode,
              message: result.error,
              moreInfo: `https://www.twilio.com/docs/api/errors/${errorCode}`
            }
          }
        } catch (parseError) {
          console.log("[DEBUG] Could not parse Twilio error details")
        }
      }

      return NextResponse.json({
        success: false,
        error: result.error,
        phone: result.phone,
        twilioError: twilioError
      })
    }

  } catch (error) {
    console.error("[DEBUG] Single SMS test error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
