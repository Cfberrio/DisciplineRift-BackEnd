import nodemailer from 'nodemailer'

// Configurar el transportador de Gmail
export const createEmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.')
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

// Verificar configuración de email
export const verifyEmailConfiguration = async () => {
  try {
    const transporter = createEmailTransporter()
    await transporter.verify()
    return { success: true, message: 'Email configuration verified' }
  } catch (error) {
    console.error('Email configuration verification failed:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Función para enviar emails con manejo de errores mejorado
export const sendEmail = async (mailOptions: {
  from?: string
  to: string
  subject: string
  html: string
}) => {
  try {
    const transporter = createEmailTransporter()
    
    // Configurar remitente por defecto
    const emailOptions = {
      from: mailOptions.from || process.env.GMAIL_USER,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html
    }

    console.log('[EMAIL] Sending email to:', emailOptions.to)
    console.log('[EMAIL] Subject:', emailOptions.subject)
    
    const info = await transporter.sendMail(emailOptions)
    
    console.log('[EMAIL] Email sent successfully:', info.messageId)
    return {
      success: true,
      messageId: info.messageId,
      email: emailOptions.to
    }
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      email: mailOptions.to
    }
  }
}

// Función para reemplazar variables en el contenido del email
export const replaceEmailVariables = (
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
