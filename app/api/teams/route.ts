import { type NextRequest, NextResponse } from "next/server"
import { teamServer } from "@/lib/db/team-service"

export async function GET() {
  try {
    console.log("[SERVER] GET /api/teams - Starting request")

    const teams = await teamServer.getAllServer()

    console.log("[SERVER] GET /api/teams - Success:", teams.length, "teams")
    return NextResponse.json(teams)
  } catch (error) {
    console.error("[SERVER] GET /api/teams - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to fetch teams", details: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[SERVER] POST /api/teams - Starting request")

    const body = await request.json()
    console.log("[SERVER] POST /api/teams - Request body:", JSON.stringify(body))

    // Validate required fields
    if (!body.name || !body.schoolid) {
      console.log("[SERVER] POST /api/teams - Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields", details: "Name and schoolid are required" },
        { status: 400 },
      )
    }

    const team = await teamServer.create(body)

    console.log("[SERVER] POST /api/teams - Success:", JSON.stringify(team))
    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("[SERVER] POST /api/teams - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to create team", details: message }, { status: 500 })
  }
}
