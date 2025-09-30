import { type NextRequest, NextResponse } from "next/server"

interface OptimizedSMSRequest {
  phone: string
  message: string
}

// Función para limpiar el mensaje de problemas comunes
const optimizeMessageForDelivery = (message: string): string => {
  let optimized = message

  // 1. Remover emojis (principal causa de undelivered)
  optimized = optimized.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
  
  // 2. Limpiar caracteres especiales problemáticos
  optimized = optimized.replace(/[^\w\s\.,!?;:()\-'"]/g, '')
  
  // 3. Normalizar espacios
  optimized = optimized.replace(/\s+/g, ' ').trim()
  
  // 4. Truncar a 160 caracteres para evitar problemas de segmentación
  if (optimized.length > 160) {
    optimized = optimized.substring(0, 157) + '...'
  }
  
  return optimized
}

// Función para limpiar números de teléfono
const cleanPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned
    } else if (cleaned.length === 10) {
      cleaned = '+1' + cleaned
    } else {
      cleaned = '+1' + cleaned.replace(/^1/, '')
    }
  }
  
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const { phone, message }: OptimizedSMSRequest = await request.json()

    if (!phone || !message) {
      return NextResponse.json(
        { success: false, error: "Phone and message are required" },
        { status: 400 }
      )
    }

    // Check if Twilio is available
    let twilio
    try {
      twilio = require('twilio')
    } catch (importError) {
      return NextResponse.json({
        success: false,
        error: 'Twilio library not installed'
      }, { status: 500 })
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return NextResponse.json({
        success: false,
        error: 'Twilio credentials not configured'
      }, { status: 500 })
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    // Limpiar y optimizar
    const cleanedTo = cleanPhoneNumber(phone)
    const cleanedFrom = cleanPhoneNumber(process.env.TWILIO_PHONE_NUMBER)
    const optimizedMessage = optimizeMessageForDelivery(message)

    console.log("[DEBUG] Optimized SMS attempt:", {
      originalPhone: phone,
      cleanedPhone: cleanedTo,
      originalMessage: message,
      optimizedMessage: optimizedMessage,
      originalLength: message.length,
      optimizedLength: optimizedMessage.length,
      removedEmojis: message !== optimizedMessage,
      fromNumber: cleanedFrom
    })

    // Enviar SMS con configuraciones optimizadas
    const smsMessage = await client.messages.create({
      body: optimizedMessage,
      from: cleanedFrom,
      to: cleanedTo,
      // Configuraciones para mejorar deliverability
      maxPrice: '0.10', // Límite de precio más alto
      provideFeedback: true, // Solicitar feedback de entrega
      attempt: 1, // Primera tentativa
      validityPeriod: 14400 // 4 horas de validez
    })

    console.log("[DEBUG] Optimized SMS result:", {
      sid: smsMessage.sid,
      status: smsMessage.status,
      to: smsMessage.to,
      from: smsMessage.from,
      price: smsMessage.price
    })

    return NextResponse.json({
      success: true,
      messageId: smsMessage.sid,
      phone: cleanedTo,
      originalMessage: message,
      optimizedMessage: optimizedMessage,
      optimizations: [
        optimizedMessage !== message ? "Removed emojis and special characters" : "No content changes needed",
        "Set delivery feedback request",
        "Increased max price limit",
        "Set validity period to 4 hours",
        "Cleaned phone number format"
      ],
      recommendations: [
        "Message optimized for maximum deliverability",
        "If still undelivered, check with carrier or try different number",
        "Monitor Twilio Console logs for detailed error codes"
      ]
    })

  } catch (error) {
    console.error("[DEBUG] Optimized SMS error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to send optimized SMS",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}




