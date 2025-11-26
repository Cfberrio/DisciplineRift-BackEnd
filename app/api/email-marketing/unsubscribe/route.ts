import { type NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase/server"
import { verifyUnsubToken } from "@/lib/mailer/unsub"

type RequestSource = "GET" | "POST"

const HTML_HEADERS = { "Content-Type": "text/html; charset=utf-8" }
const TEXT_HEADERS = { "Content-Type": "text/plain; charset=utf-8" }

function maskEmail(email: string) {
  const [local, domain] = email.split("@")
  if (!local || !domain) return email
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  return `${local[0]}***${local.slice(-1)}@${domain}`
}

function buildHtmlResponse(options: { heading: string; message: string; emoji?: string }) {
  const emoji = options.emoji ? `${options.emoji} ` : ""
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.heading}</title>
  <style>
    :root {
      color-scheme: light;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f8fafc;
      padding: 24px;
    }
    .card {
      background: white;
      padding: 40px 32px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      max-width: 480px;
      text-align: center;
    }
    h1 {
      color: #0f172a;
      margin-bottom: 16px;
      font-size: 26px;
    }
    p {
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }
    .small {
      font-size: 13px;
      margin-top: 18px;
      color: #94a3b8;
    }
    a {
      color: #0ea5e9;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>${emoji}${options.heading}</h1>
    <p>${options.message}</p>
    <p class="small">If this was a mistake, contact support@disciplinerift.com.</p>
  </div>
</body>
</html>`
}

async function processUnsubscribeRequest(token: string | null, source: RequestSource) {
  const requestTime = new Date().toISOString()
  console.log(`[UNSUBSCRIBE] ${source} request at ${requestTime}. Token=${token ? token.substring(0, 8) + "…" : "NONE"}`)

  try {
    if (!token) {
      console.warn("[UNSUBSCRIBE] Missing token in request")
      return new NextResponse(
        buildHtmlResponse({
          heading: "Invalid link",
          message: "The unsubscribe link is invalid or has expired.",
          emoji: "⚠️",
        }),
        { status: 400, headers: HTML_HEADERS }
      )
    }

    const { email, valid } = verifyUnsubToken(token)

    if (!valid || !email) {
      console.warn("[UNSUBSCRIBE] Token validation failed")
      return new NextResponse(
        buildHtmlResponse({
          heading: "Invalid token",
          message: "The unsubscribe token is invalid or has already expired.",
          emoji: "⚠️",
        }),
        { status: 400, headers: HTML_HEADERS }
      )
    }

    const supabase = createServiceSupabaseClient()
    const { error: deleteError, count } = await supabase
      .from("Newsletter")
      .delete({ count: "exact" })
      .ilike("email", email)

    if (deleteError) {
      console.error("[UNSUBSCRIBE] Database error while deleting subscriber", {
        code: deleteError.code,
        hint: deleteError.hint,
      })
      return new NextResponse(
        buildHtmlResponse({
          heading: "Temporary issue",
          message: "We could not complete your request. Please try again later.",
          emoji: "⚠️",
        }),
        { status: 500, headers: HTML_HEADERS }
      )
    }

    console.log("[UNSUBSCRIBE] Deletion processed", {
      source,
      removedRows: count ?? 0,
      email: maskEmail(email),
    })

    if (source === "POST") {
      return new NextResponse("OK", { status: 200, headers: TEXT_HEADERS })
    }

    return new NextResponse(
      buildHtmlResponse({
        heading: "You're unsubscribed",
        message: "Your email has been removed from our marketing list. Thanks for staying in control of what you receive.",
        emoji: "✅",
      }),
      { status: 200, headers: HTML_HEADERS }
    )
  } catch (error) {
    console.error("[UNSUBSCRIBE] Unexpected error", error)
    return new NextResponse(
      buildHtmlResponse({
        heading: "Something went wrong",
        message: "An unexpected error occurred. Please try again in a few minutes.",
        emoji: "⚠️",
      }),
      { status: 500, headers: HTML_HEADERS }
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
