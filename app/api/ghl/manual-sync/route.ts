import { type NextRequest, NextResponse } from "next/server"
import { syncContactsToGHL } from "@/lib/ghl/ghl-sync"
import { verifyGHLConfiguration } from "@/lib/ghl/ghl-client"
import { createServiceSupabaseClient } from "@/lib/supabase/server"

const INCREMENTAL_HOURS_WINDOW = 7

async function authenticateUser(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return false
  }

  const token = authHeader.replace("Bearer ", "").trim()
  if (!token) {
    return false
  }

  try {
    const serviceClient = createServiceSupabaseClient()
    const { data, error } = await serviceClient.auth.getUser(token)
    return !error && !!data.user
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAuthenticated = await authenticateUser(request)
    if (!isAuthenticated) {
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
          details: `Missing environment variables: ${configCheck.missingVars.join(", ")}`,
          missing: configCheck.missingVars,
        },
        { status: 500 }
      )
    }

    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const mode = body.mode as string | undefined

    if (mode === "incremental") {
      const sinceDate = new Date()
      sinceDate.setHours(sinceDate.getHours() - INCREMENTAL_HOURS_WINDOW)
      const since = sinceDate.toISOString()

      console.log(`[GHL Manual Sync] Incremental sync (since=${since})`)
      const summary = await syncContactsToGHL({ since })
      return NextResponse.json({ success: true, summary })
    }

    if (mode === "full") {
      const offset = typeof body.offset === "number" ? body.offset : 0
      const limit = typeof body.limit === "number" ? body.limit : 50

      console.log(`[GHL Manual Sync] Full sync batch (offset=${offset}, limit=${limit})`)
      const summary = await syncContactsToGHL({ offset, limit })
      return NextResponse.json({ success: true, summary })
    }

    return NextResponse.json(
      { error: "Invalid mode. Use 'incremental' or 'full'" },
      { status: 400 }
    )
  } catch (error) {
    console.error("[GHL Manual Sync] Failed:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Sync failed", details: message },
      { status: 500 }
    )
  }
}
