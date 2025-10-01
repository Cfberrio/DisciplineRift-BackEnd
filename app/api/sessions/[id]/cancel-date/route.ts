import { type NextRequest, NextResponse } from "next/server"
import { sessionServer } from "@/lib/db/session-service"

// POST - Cancel a specific date for a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log("[SERVER] POST /api/sessions/[id]/cancel-date - Starting request for ID:", id)

    const body = await request.json()
    const { date_to_cancel } = body

    if (!date_to_cancel) {
      return NextResponse.json(
        { error: "date_to_cancel is required" },
        { status: 400 }
      )
    }

    console.log("[SERVER] POST /api/sessions/[id]/cancel-date - Canceling date:", date_to_cancel)

    // Get the current session
    const session = await sessionServer.getByIdServer(id)

    if (!session) {
      console.log("[SERVER] POST /api/sessions/[id]/cancel-date - Session not found:", id)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Get current canceled dates
    let canceledDates: string[] = []
    if (session.cancel) {
      try {
        // Try to parse as JSON array first
        canceledDates = JSON.parse(session.cancel)
      } catch {
        // If not JSON, treat as comma-separated string
        canceledDates = session.cancel.split(',').filter(d => d.trim())
      }
    }

    // Add the new date if not already canceled
    if (!canceledDates.includes(date_to_cancel)) {
      canceledDates.push(date_to_cancel)
    }

    // Update the session with the new canceled dates as JSON array
    const updatedSession = await sessionServer.update(id, {
      cancel: JSON.stringify(canceledDates)
    })

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

