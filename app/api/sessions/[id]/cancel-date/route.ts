import { type NextRequest, NextResponse } from "next/server"
import { sessionServer } from "@/lib/db/session-service"

// POST - Cancel a specific date for a session
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionid } = await params
    const body = await request.json()
    
    console.log("[SERVER] POST /api/sessions/[id]/cancel-date - Starting request for session:", sessionid)
    console.log("[SERVER] POST /api/sessions/[id]/cancel-date - Request body:", JSON.stringify(body))

    if (!body.date_to_cancel) {
      return NextResponse.json(
        { error: "Missing required field: date_to_cancel" },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.date_to_cancel)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      )
    }

    const updatedSession = await sessionServer.cancelDate(sessionid, body.date_to_cancel)

    console.log("[SERVER] POST /api/sessions/[id]/cancel-date - Success")
    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error("[SERVER] POST /api/sessions/[id]/cancel-date - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to cancel date for session", details: message },
      { status: 500 }
    )
  }
}

// DELETE - Restore a previously canceled date
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionid } = await params
    const { searchParams } = new URL(request.url)
    const dateToRestore = searchParams.get("date")
    
    console.log("[SERVER] DELETE /api/sessions/[id]/cancel-date - Starting request for session:", sessionid)
    console.log("[SERVER] DELETE /api/sessions/[id]/cancel-date - Date to restore:", dateToRestore)

    if (!dateToRestore) {
      return NextResponse.json(
        { error: "Missing required parameter: date" },
        { status: 400 }
      )
    }

    const updatedSession = await sessionServer.restoreDate(sessionid, dateToRestore)

    console.log("[SERVER] DELETE /api/sessions/[id]/cancel-date - Success")
    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error("[SERVER] DELETE /api/sessions/[id]/cancel-date - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to restore date for session", details: message },
      { status: 500 }
    )
  }
}




