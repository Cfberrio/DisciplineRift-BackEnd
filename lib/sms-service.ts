// SMS Service using Twilio
// You'll need to install twilio: npm install twilio
// And set up environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
  phone: string
}

export const verifySMSConfiguration = async () => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        message: 'Missing Twilio credentials. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.'
      }
    }

    // Basic validation - we could test the connection here if needed
    return { success: true, message: 'SMS configuration verified' }
  } catch (error) {
    console.error('SMS configuration verification failed:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Función para limpiar y formatear números de teléfono
const cleanPhoneNumber = (phone: string): string => {
  // Remover todos los caracteres no numéricos excepto el +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  console.log('[SMS] Original number:', phone)
  
  // Si no empieza con +, asumir que es número de US/Canada y agregar +1
  if (!cleaned.startsWith('+')) {
    // Si ya tiene 11 dígitos (1XXXXXXXXXX), agregar + al inicio
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned
    }
    // Si tiene 10 dígitos (XXXXXXXXXX), agregar +1
    else if (cleaned.length === 10) {
      cleaned = '+1' + cleaned
    }
    // Si tiene otros formatos, intentar agregando +1
    else {
      cleaned = '+1' + cleaned.replace(/^1/, '') // remover 1 inicial si existe
    }
  }
  
  console.log('[SMS] Cleaned number:', cleaned)
  return cleaned
}

export const sendSMS = async (options: {
  to: string
  message: string
}): Promise<SMSResult> => {
  try {
    // Check if Twilio is available
    let twilio
    try {
      twilio = require('twilio')
    } catch (importError) {
      console.error('[SMS] Twilio not installed. Please run: npm install twilio')
      return {
        success: false,
        error: 'Twilio library not installed. Please run: npm install twilio',
        phone: options.to
      }
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio credentials not configured')
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

    // Limpiar números de teléfono
    const cleanedTo = cleanPhoneNumber(options.to)
    const cleanedFrom = cleanPhoneNumber(process.env.TWILIO_PHONE_NUMBER)
    
    console.log('[SMS] Cleaned TO number:', cleanedTo)
    console.log('[SMS] Cleaned FROM number:', cleanedFrom)
    console.log('[SMS] Sending SMS to:', cleanedTo)
    console.log('[SMS] Message length:', options.message.length)
    
    // Limpiar el mensaje de emojis y caracteres especiales que pueden causar undelivered
    let cleanedMessage = options.message
    // Remover emojis
    cleanedMessage = cleanedMessage.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    // Normalizar espacios
    cleanedMessage = cleanedMessage.replace(/\s+/g, ' ').trim()
    
    console.log('[SMS] Original message length:', options.message.length)
    console.log('[SMS] Cleaned message length:', cleanedMessage.length)
    if (options.message !== cleanedMessage) {
      console.log('[SMS] Message was cleaned (emojis/special chars removed)')
    }
    
    const message = await client.messages.create({
      body: cleanedMessage,
      from: cleanedFrom,
      to: cleanedTo,
      // Configuraciones para A2P 10DLC y mejor deliverability
      maxPrice: '0.10', // Límite de precio más alto
      provideFeedback: true, // Solicitar feedback de entrega
      validityPeriod: 14400 // 4 horas de validez
    })
    
    console.log('[SMS] SMS sent successfully:', {
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from
    })
    return {
      success: true,
      messageId: message.sid,
      phone: cleanedTo
    }
  } catch (error) {
    console.error('[SMS] Failed to send SMS:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      phone: options.to
    }
  }
}

// Función para reemplazar variables en el contenido del SMS
export const replaceSMSVariables = (
  content: string,
  variables: Record<string, string | number | undefined>
) => {
  let processedContent = content
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`
    const replacement = value?.toString() || ''
    processedContent = processedContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement)
  })
  
  return processedContent
}




