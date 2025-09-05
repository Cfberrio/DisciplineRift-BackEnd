import { type NextRequest, NextResponse } from "next/server"
import { sessionExclusionsServer } from "@/lib/db/session-exclusions-service"

// POST - Exclude a specific date from a session
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionid } = await params
    const body = await request.json()
    
    console.log("[SERVER] POST /api/sessions/[id]/exclude-date - Starting request for session:", sessionid)
    console.log("[SERVER] POST /api/sessions/[id]/exclude-date - Request body:", JSON.stringify(body))

    if (!body.excluded_date) {
      return NextResponse.json(
        { error: "Missing required field: excluded_date" },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.excluded_date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    const exclusion = await sessionExclusionsServer.create({
      sessionid,
      excluded_date: body.excluded_date
    })

    console.log("[SERVER] POST /api/sessions/[id]/exclude-date - Success")
    return NextResponse.json(exclusion, { status: 201 })
  } catch (error) {
    console.error("[SERVER] POST /api/sessions/[id]/exclude-date - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to exclude date from session", details: message },
      { status: 500 }
    )
  }
}

// DELETE - Remove exclusion for a specific date
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionid } = await params
    const { searchParams } = new URL(request.url)
    const excluded_date = searchParams.get("date")
    
    console.log("[SERVER] DELETE /api/sessions/[id]/exclude-date - Starting request for session:", sessionid)
    console.log("[SERVER] DELETE /api/sessions/[id]/exclude-date - Date to restore:", excluded_date)

    if (!excluded_date) {
      return NextResponse.json(
        { error: "Missing required parameter: date" },
        { status: 400 }
      )
    }

    await sessionExclusionsServer.deleteBySessionAndDate(sessionid, excluded_date)

    console.log("[SERVER] DELETE /api/sessions/[id]/exclude-date - Success")
    return NextResponse.json({ message: "Date exclusion removed successfully" })
  } catch (error) {
    console.error("[SERVER] DELETE /api/sessions/[id]/exclude-date - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to remove date exclusion", details: message },
      { status: 500 }
    )
  }
}

