import nodemailer from 'nodemailer'

export interface EmailOptions {
  to: string[]
  subject: string
  html: string
  text?: string
}

export interface EmailResult {
  sent: number
  skipped: number
  errors: string[]
}

// Configurar el transportador de email
function createTransporter() {
  // Verificar que las variables de entorno estén configuradas
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !port || !user || !pass) {
    throw new Error('Configuración de email incompleta. Verificar variables de entorno SMTP_*')
  }

  return nodemailer.createTransporter({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465, // true para puerto 465, false para otros puertos
    auth: {
      user,
      pass,
    },
    // Configuraciones adicionales para mayor compatibilidad
    tls: {
      rejectUnauthorized: false
    }
  })
}

/**
 * Envía emails a múltiples destinatarios
 */
export async function sendMail({
  to,
  subject,
  html,
  text
}: EmailOptions): Promise<EmailResult> {
  const result: EmailResult = {
    sent: 0,
    skipped: 0,
    errors: []
  }

  if (!to || to.length === 0) {
    result.errors.push('No hay destinatarios especificados')
    return result
  }

  try {
    const transporter = createTransporter()
    
    // Verificar la conexión
    await transporter.verify()
    
    // Filtrar emails válidos
    const validEmails = to.filter(email => {
      if (!email || !email.includes('@')) {
        result.skipped++
        return false
      }
      return true
    })

    if (validEmails.length === 0) {
      result.errors.push('No se encontraron emails válidos')
      return result
    }

    // Enviar emails (en lotes para evitar límites de rate)
    const batchSize = 10
    const batches = []
    
    for (let i = 0; i < validEmails.length; i += batchSize) {
      batches.push(validEmails.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      const promises = batch.map(async (email) => {
        try {
          await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'Sistema de Prácticas'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject,
            html,
            text: text || stripHtml(html)
          })
          result.sent++
        } catch (error) {
          result.errors.push(`Error enviando a ${email}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        }
      })

      await Promise.all(promises)
      
      // Pequeña pausa entre lotes
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    result.errors.push(`Error de configuración: ${errorMessage}`)
  }

  return result
}

/**
 * Convierte HTML a texto plano simple
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remover tags HTML
    .replace(/&nbsp;/g, ' ') // Convertir &nbsp; a espacios
    .replace(/&amp;/g, '&') // Convertir &amp; a &
    .replace(/&lt;/g, '<') // Convertir &lt; a <
    .replace(/&gt;/g, '>') // Convertir &gt; a >
    .replace(/\s+/g, ' ') // Colapsar espacios múltiples
    .trim()
}

/**
 * Genera el template HTML para emails de práctica
 */
export function generatePracticeEmailTemplate({
  teamName,
  practiceDate,
  practiceTime,
  coachName,
  dashboardUrl
}: {
  teamName: string
  practiceDate: string
  practiceTime: string
  coachName?: string
  dashboardUrl?: string
}): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recordatorio de Práctica - ${teamName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-box { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3B82F6; }
        .button { display: inline-block; background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏐 Recordatorio de Práctica</h1>
        <h2>${teamName}</h2>
      </div>
      
      <div class="content">
        <p>¡Hola! Te recordamos que tienes una práctica programada:</p>
        
        <div class="info-box">
          <strong>📅 Fecha:</strong> ${practiceDate}<br>
          <strong>⏰ Hora:</strong> ${practiceTime}<br>
          ${coachName ? `<strong>👨‍💼 Coach:</strong> ${coachName}<br>` : ''}
        </div>
        
        <p>Por favor, asegúrate de:</p>
        <ul>
          <li>Llegar 10 minutos antes del inicio</li>
          <li>Traer todo el equipo necesario</li>
          <li>Mantener hidratación adecuada</li>
        </ul>
        
        ${dashboardUrl ? `
          <div style="text-align: center; margin: 20px 0;">
            <a href="${dashboardUrl}" class="button">Ver Dashboard</a>
          </div>
        ` : ''}
        
        <p>¡Nos vemos en la práctica!</p>
      </div>
      
      <div class="footer">
        <p>Este es un mensaje automático del sistema de gestión de prácticas.</p>
      </div>
    </body>
    </html>
  `

  const text = `
    RECORDATORIO DE PRÁCTICA - ${teamName}
    
    ¡Hola! Te recordamos que tienes una práctica programada:
    
    📅 Fecha: ${practiceDate}
    ⏰ Hora: ${practiceTime}
    ${coachName ? `👨‍💼 Coach: ${coachName}` : ''}
    
    Por favor, asegúrate de:
    - Llegar 10 minutos antes del inicio
    - Traer todo el equipo necesario
    - Mantener hidratación adecuada
    
    ${dashboardUrl ? `Ver Dashboard: ${dashboardUrl}` : ''}
    
    ¡Nos vemos en la práctica!
    
    ---
    Este es un mensaje automático del sistema de gestión de prácticas.
  `

  return { html, text }
}

/**
 * Verifica si la configuración de email está completa
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}
