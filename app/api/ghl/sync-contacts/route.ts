import { type NextRequest, NextResponse } from "next/server"
import { syncContactsToGHL } from "@/lib/ghl/ghl-sync"
import { verifyGHLConfiguration } from "@/lib/ghl/ghl-client"

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("[GHL API] CRON_SECRET environment variable is not set")
    return false
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "").trim()
    if (token === cronSecret) {
      return true
    }
  }

  const secretParam = request.nextUrl.searchParams.get("secret")
  if (secretParam === cronSecret) {
    return true
  }

  return false
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      console.warn("[GHL API] Unauthorized sync attempt")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const configCheck = verifyGHLConfiguration()
    if (!configCheck.isValid) {
      return NextResponse.json(
        {
          error: "GHL configuration incomplete",
          missing: configCheck.missingVars,
        },
        { status: 500 }
      )
    }

    console.log("[GHL API] Starting contact sync...")
    const summary = await syncContactsToGHL()

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error) {
    console.error("[GHL API] Sync failed:", error)
    const message =
      error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      { error: "Sync failed", details: message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const configCheck = verifyGHLConfiguration()

    return NextResponse.json({
      status: "ready",
      configuration: {
        isValid: configCheck.isValid,
        missingVars: configCheck.missingVars,
        locationId: process.env.GHL_LOCATION_ID
          ? `${process.env.GHL_LOCATION_ID.substring(0, 6)}...`
          : "NOT SET",
        apiKey: process.env.GHL_API_KEY
          ? `${process.env.GHL_API_KEY.substring(0, 8)}...`
          : "NOT SET",
      },
    })
  } catch (error) {
    console.error("[GHL API] Status check failed:", error)
    return NextResponse.json(
      { error: "Status check failed" },
      { status: 500 }
    )
  }
}
