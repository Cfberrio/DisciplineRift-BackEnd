import { type NextRequest, NextResponse } from "next/server"
import { sessionServer } from "@/lib/db/session-service"

export async function GET(request: NextRequest) {
  try {
    console.log("[SERVER] GET /api/sessions - Starting request")

    const { searchParams } = new URL(request.url)
    const teamid = searchParams.get("teamid")

    let sessions
    if (teamid) {
      console.log("[SERVER] Fetching sessions for team:", teamid)
      sessions = await sessionServer.getByTeamId(teamid)
    } else {
      sessions = await sessionServer.getAll()
    }

    console.log("[SERVER] GET /api/sessions - Success:", sessions.length, "sessions")
    return NextResponse.json(sessions)
  } catch (error) {
    console.error("[SERVER] GET /api/sessions - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to fetch sessions", details: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[SERVER] POST /api/sessions - Starting request")

    const body = await request.json()
    console.log("[SERVER] POST /api/sessions - Request body:", JSON.stringify(body))

    // Validate required fields
    if (!body.teamid || !body.startdate || !body.starttime || !body.endtime) {
      console.log("[SERVER] POST /api/sessions - Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields", details: "teamid, startdate, starttime, and endtime are required" },
        { status: 400 },
      )
    }

    const session = await sessionServer.create(body)

    console.log("[SERVER] POST /api/sessions - Success:", JSON.stringify(session))
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error("[SERVER] POST /api/sessions - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to create session", details: message }, { status: 500 })
  }
}
