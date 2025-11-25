import { type NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase/server"
import { verifyUnsubToken } from "@/lib/mailer/unsub"

type RequestSource = "GET" | "POST"

async function processUnsubscribeRequest(token: string | null, source: RequestSource) {
  const requestTime = new Date().toISOString()
  console.log(`[UNSUBSCRIBE] ========================================`)
  console.log(`[UNSUBSCRIBE] Received ${source} unsubscribe request at ${requestTime}`)
  console.log(`[UNSUBSCRIBE] Token received: ${token ? token.substring(0, 20) + '...' : 'NONE'}`)

  try {
    if (!token) {
      console.error('[UNSUBSCRIBE] ✗ No token provided in request')

      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Unsubscribe Link</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #dc2626;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Link</h1>
            <p>The unsubscribe link is invalid or has expired.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }

    console.log('[UNSUBSCRIBE] Verifying and decoding token...')
    const { email, valid } = verifyUnsubToken(token)
    
    console.log(`[UNSUBSCRIBE] Token validation result: ${valid ? 'VALID' : 'INVALID'}`)
    console.log(`[UNSUBSCRIBE] Email extracted from token: ${email || 'NONE'}`)

    if (!valid || !email) {
      console.error('[UNSUBSCRIBE] ✗ Token validation failed')

      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Token</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #dc2626;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Invalid Token</h1>
            <p>The unsubscribe token is invalid or has been tampered with.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 400,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }

    console.log(`[UNSUBSCRIBE] Attempting to delete email from Newsletter table: ${email}`)
    console.log('[UNSUBSCRIBE] Connecting to Supabase with service role client...')
    
    const supabase = createServiceSupabaseClient()
    
    console.log(`[UNSUBSCRIBE] Executing DELETE query for email: ${email}`)
    const { error: deleteError, count } = await supabase
      .from('Newsletter')
      .delete({ count: 'exact' })
      .ilike('email', email)

    if (deleteError) {
      console.error("[UNSUBSCRIBE] ✗ Database error while deleting:")
      console.error(`[UNSUBSCRIBE] Error code: ${deleteError.code}`)
      console.error(`[UNSUBSCRIBE] Error message: ${deleteError.message}`)
      console.error(`[UNSUBSCRIBE] Error details:`, deleteError)
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
            }
            h1 {
              color: #dc2626;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ Error</h1>
            <p>An error occurred while processing your unsubscribe request. Please try again later.</p>
          </div>
        </body>
        </html>
        `,
        {
          status: 500,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      )
    }

    console.log(`[UNSUBSCRIBE] ✓ DELETE query executed successfully`)
    console.log(`[UNSUBSCRIBE] Rows affected: ${count !== null ? count : 'unknown'}`)
    console.log(`[UNSUBSCRIBE] ✓ Successfully unsubscribed: ${email}`)
    console.log(`[UNSUBSCRIBE] Email ${email} has been removed from Newsletter table`)
    console.log(`[UNSUBSCRIBE] Request source: ${source}`)
    console.log(`[UNSUBSCRIBE] ========================================`)

    if (source === "POST") {
      return new NextResponse("OK", {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      })
    }

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed Successfully</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
          }
          h1 {
            color: #10b981;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 15px;
          }
          .email {
            font-weight: bold;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Successfully Unsubscribed</h1>
          <p>You have been successfully unsubscribed from our newsletter.</p>
          <p class="email">${email}</p>
          <p>You will no longer receive emails from us.</p>
          <p>If this was a mistake, you can resubscribe at any time through our website.</p>
        </div>
      </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
      )

  } catch (error) {
    console.error("[UNSUBSCRIBE] ✗ Unexpected error in unsubscribe handler:")
    console.error("[UNSUBSCRIBE] Error:", error)
    console.error(`[UNSUBSCRIBE] Error type: ${error instanceof Error ? error.constructor.name : typeof error}`)
    if (error instanceof Error) {
      console.error(`[UNSUBSCRIBE] Error message: ${error.message}`)
      console.error(`[UNSUBSCRIBE] Error stack:`, error.stack)
    }
    console.log(`[UNSUBSCRIBE] ========================================`)
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
          }
          h1 {
            color: #dc2626;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Error</h1>
          <p>An unexpected error occurred. Please try again later.</p>
        </div>
      </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  return processUnsubscribeRequest(token, "GET")
}

export async function POST(request: NextRequest) {
  console.log('[UNSUBSCRIBE] POST request received with headers:', {
    'list-unsubscribe-post': request.headers.get('list-unsubscribe-post'),
    'user-agent': request.headers.get('user-agent'),
  })

  let token = request.nextUrl.searchParams.get('token')

  if (!token) {
    // Attempt to parse JSON body
    const contentType = request.headers.get('content-type') || ''
    try {
      if (contentType.includes('application/json')) {
        const body = await request.json()
        token = body?.token ?? body?.Token ?? body?.unsubscribeToken ?? null
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        token = (formData.get('token') || formData.get('Token') || formData.get('unsubscribeToken')) as string | null
      } else {
        const rawText = (await request.text()).trim()
        if (rawText.includes('=')) {
          const params = new URLSearchParams(rawText)
          token = params.get('token') || params.get('Token') || params.get('unsubscribeToken')
        }
      }
    } catch (error) {
      console.warn('[UNSUBSCRIBE] Warning: Failed to parse POST body for token', error)
    }
  }

  return processUnsubscribeRequest(token, "POST")
}
