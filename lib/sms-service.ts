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

    console.log('[SMS] Sending SMS to:', options.to)
    console.log('[SMS] Message length:', options.message.length)
    
    const message = await client.messages.create({
      body: options.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.to
    })
    
    console.log('[SMS] SMS sent successfully:', message.sid)
    return {
      success: true,
      messageId: message.sid,
      phone: options.to
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

