import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import net from "net"

interface DiagnosticStep {
  step: string
  status: 'pending' | 'success' | 'failed'
  message: string
  duration?: number
  error?: string
  code?: string
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const diagnostics: DiagnosticStep[] = []
  
  try {
    console.log('[RELAY-TEST] Starting SMTP Relay diagnostics...')

    // Step 1: Check environment variables
    const step1Start = Date.now()
    const envVars = {
      RELAY_HOST: process.env.RELAY_HOST,
      RELAY_PORT: process.env.RELAY_PORT,
      RELAY_USER: process.env.RELAY_USER,
      RELAY_PASS: process.env.RELAY_PASS ? '***SET***' : undefined,
      RELAY_REQUIRE_TLS: process.env.RELAY_REQUIRE_TLS,
    }

    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value && key !== 'RELAY_REQUIRE_TLS')
      .map(([key]) => key)

    if (missingVars.length > 0) {
      diagnostics.push({
        step: '1. Environment Variables Check',
        status: 'failed',
        message: `Missing variables: ${missingVars.join(', ')}`,
        duration: Date.now() - step1Start,
        error: 'Configuration incomplete',
      })
      
      return NextResponse.json({
        success: false,
        message: 'SMTP Relay configuration incomplete',
        diagnostics,
        envVars,
        totalDuration: Date.now() - startTime,
      })
    }

    diagnostics.push({
      step: '1. Environment Variables Check',
      status: 'success',
      message: 'All required variables are set',
      duration: Date.now() - step1Start,
    })

    console.log('[RELAY-TEST] Environment variables OK')

    // Step 2: TCP Connection Test
    const step2Start = Date.now()
    const host = process.env.RELAY_HOST || 'smtp-relay.gmail.com'
    const port = Number(process.env.RELAY_PORT) || 587

    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.createConnection(port, host)
        const timeout = setTimeout(() => {
          socket.destroy()
          reject(new Error('Connection timeout (10s)'))
        }, 10000)

        socket.on('connect', () => {
          clearTimeout(timeout)
          socket.end()
          resolve()
        })

        socket.on('error', (err) => {
          clearTimeout(timeout)
          reject(err)
        })
      })

      diagnostics.push({
        step: '2. TCP Connection Test',
        status: 'success',
        message: `Successfully connected to ${host}:${port}`,
        duration: Date.now() - step2Start,
      })

      console.log(`[RELAY-TEST] TCP connection to ${host}:${port} OK`)
    } catch (tcpError: any) {
      diagnostics.push({
        step: '2. TCP Connection Test',
        status: 'failed',
        message: `Failed to connect to ${host}:${port}`,
        duration: Date.now() - step2Start,
        error: tcpError.message,
        code: tcpError.code,
      })

      console.error('[RELAY-TEST] TCP connection failed:', tcpError)

      return NextResponse.json({
        success: false,
        message: 'TCP connection failed',
        diagnostics,
        envVars,
        totalDuration: Date.now() - startTime,
      })
    }

    // Step 3: Create Transporter
    const step3Start = Date.now()
    let transporter: nodemailer.Transporter

    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: false,
        requireTLS: String(process.env.RELAY_REQUIRE_TLS) === 'true' || true,
        auth: {
          user: process.env.RELAY_USER!,
          pass: (process.env.RELAY_PASS || '').replace(/\s+/g, ''),
        },
        logger: true,
        debug: false,
      })

      diagnostics.push({
        step: '3. Create Transporter',
        status: 'success',
        message: 'Transporter created successfully',
        duration: Date.now() - step3Start,
      })

      console.log('[RELAY-TEST] Transporter created OK')
    } catch (transportError: any) {
      diagnostics.push({
        step: '3. Create Transporter',
        status: 'failed',
        message: 'Failed to create transporter',
        duration: Date.now() - step3Start,
        error: transportError.message,
      })

      console.error('[RELAY-TEST] Transporter creation failed:', transportError)

      return NextResponse.json({
        success: false,
        message: 'Transporter creation failed',
        diagnostics,
        envVars,
        totalDuration: Date.now() - startTime,
      })
    }

    // Step 4: SMTP Verification (EHLO, STARTTLS, AUTH)
    const step4Start = Date.now()

    try {
      await transporter.verify()

      diagnostics.push({
        step: '4. SMTP Verification (EHLO, STARTTLS, AUTH)',
        status: 'success',
        message: 'SMTP Relay connection verified successfully',
        duration: Date.now() - step4Start,
      })

      console.log('[RELAY-TEST] SMTP verification OK - Relay is READY!')

      return NextResponse.json({
        success: true,
        message: 'SMTP Relay is fully configured and ready to use!',
        diagnostics,
        envVars,
        recommendation: 'You can now send emails using the relay provider',
        totalDuration: Date.now() - startTime,
      })
    } catch (verifyError: any) {
      const errorCode = verifyError.code || verifyError.responseCode
      const errorResponse = verifyError.response || verifyError.message

      let errorExplanation = ''
      if (errorCode === 421 || errorCode === 'ECONNECTION') {
        errorExplanation = 'SMTP Relay service is not yet active. This is normal if you just enabled it in Google Admin Console. Wait 30-60 minutes and try again.'
      } else if (errorCode === 535 || errorCode === 'EAUTH') {
        errorExplanation = 'Authentication failed. Check that RELAY_PASS is a valid App Password (16 characters) from https://myaccount.google.com/apppasswords'
      } else if (errorCode === 'ETIMEDOUT') {
        errorExplanation = 'Connection timed out. Check your firewall or network settings.'
      } else {
        errorExplanation = 'Unknown error. Check the error details below.'
      }

      diagnostics.push({
        step: '4. SMTP Verification (EHLO, STARTTLS, AUTH)',
        status: 'failed',
        message: errorExplanation,
        duration: Date.now() - step4Start,
        error: errorResponse,
        code: errorCode?.toString(),
      })

      console.error('[RELAY-TEST] SMTP verification failed:', verifyError)

      return NextResponse.json({
        success: false,
        message: 'SMTP Relay verification failed',
        diagnostics,
        envVars,
        errorCode,
        errorResponse,
        recommendation: errorExplanation,
        totalDuration: Date.now() - startTime,
      })
    }

  } catch (error: any) {
    console.error('[RELAY-TEST] Unexpected error:', error)

    return NextResponse.json({
      success: false,
      message: 'Unexpected error during diagnostics',
      error: error.message,
      totalDuration: Date.now() - startTime,
    }, { status: 500 })
  }
}








