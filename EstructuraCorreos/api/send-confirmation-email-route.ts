import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Configurar el transportador de Gmail (consistente con el resto del sistema)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('Send confirmation email endpoint called')
    
    const { to, subject, htmlContent } = await request.json()
    
    console.log('Received request:', { to, subject: subject?.substring(0, 50), htmlLength: htmlContent?.length })

    if (!to || !subject || !htmlContent) {
      console.log('Missing fields validation failed')
      return NextResponse.json(
        { success: false, message: 'Missing required fields: to, subject, htmlContent' },
        { status: 400 }
      )
    }

    // Verificar configuración de Gmail (consistente con el sistema principal)
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Gmail credentials not configured')
      console.error('- GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Missing')
      console.error('- GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ Missing')
      return NextResponse.json(
        { success: false, message: 'Email service not configured - missing Gmail credentials' },
        { status: 500 }
      )
    }

    console.log('Sending confirmation email to:', to)

    try {
      const transporter = createTransporter()
      
      const mailOptions = {
        from: `"Discipline Rift" <${process.env.GMAIL_USER}>`,
        to: to,
        subject: subject,
        html: htmlContent,
      }

      const info = await transporter.sendMail(mailOptions)

      console.log('Email sent successfully via Gmail:', info.messageId)

      return NextResponse.json({ 
        success: true, 
        message: 'Confirmation email sent successfully',
        messageId: info.messageId,
        to: to
      })

    } catch (emailError) {
      console.error('Gmail service error:', emailError)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email service error',
          error: emailError instanceof Error ? emailError.message : 'Unknown Gmail error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in send-confirmation-email API:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Add GET method for testing
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Send confirmation email endpoint is available' 
  })
}
