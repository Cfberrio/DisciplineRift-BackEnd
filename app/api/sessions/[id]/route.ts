import { type NextRequest, NextResponse } from "next/server"
import { sessionServer } from "@/lib/db/session-service"

// GET single session by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[SERVER] GET /api/sessions/[id] - Starting request for ID:", id)

    const session = await sessionServer.getByIdServer(id)

    if (!session) {
      console.log("[SERVER] GET /api/sessions/[id] - Session not found:", id)
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    console.log("[SERVER] GET /api/sessions/[id] - Success")
    return NextResponse.json(session)
  } catch (error) {
    console.error("[SERVER] GET /api/sessions/[id] - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to fetch session", details: message }, { status: 500 })
  }
}

// UPDATE session by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[SERVER] PUT /api/sessions/[id] - Starting request for ID:", id)

    const body = await request.json()
    console.log("[SERVER] PUT /api/sessions/[id] - Request body:", JSON.stringify(body))

    const session = await sessionServer.update(id, body)

    console.log("[SERVER] PUT /api/sessions/[id] - Success")
    return NextResponse.json(session)
  } catch (error) {
    console.error("[SERVER] PUT /api/sessions/[id] - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to update session", details: message }, { status: 500 })
  }
}

// DELETE session by ID
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    console.log("[SERVER] DELETE /api/sessions/[id] - Starting request for ID:", id)

    await sessionServer.delete(id)

    console.log("[SERVER] DELETE /api/sessions/[id] - Success")
    return NextResponse.json({ message: "Session deleted successfully" })
  } catch (error) {
    console.error("[SERVER] DELETE /api/sessions/[id] - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to delete session", details: message }, { status: 500 })
  }
}
