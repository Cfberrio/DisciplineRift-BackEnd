import { type NextRequest, NextResponse } from "next/server"
import { teamServer } from "@/lib/db/team-service"
import { sessionServer } from "@/lib/db/session-service"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[SERVER] GET /api/teams/[id] - Starting request for ID:", params.id)

    const team = await teamServer.getByIdServer(params.id)

    if (!team) {
      console.log("[SERVER] GET /api/teams/[id] - Team not found:", params.id)
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    console.log("[SERVER] GET /api/teams/[id] - Success:", team.teamid)
    return NextResponse.json(team)
  } catch (error) {
    console.error("[SERVER] GET /api/teams/[id] - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to fetch team", details: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[SERVER] PUT /api/teams/[id] - Starting request for ID:", params.id)

    const body = await request.json()
    console.log("[SERVER] PUT /api/teams/[id] - Request body:", JSON.stringify(body))

    const team = await teamServer.update(params.id, body)

    console.log("[SERVER] PUT /api/teams/[id] - Success:", JSON.stringify(team))
    return NextResponse.json(team)
  } catch (error) {
    console.error("[SERVER] PUT /api/teams/[id] - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to update team", details: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[SERVER] DELETE /api/teams/[id] - Starting request for ID:", params.id)

    // First, delete all sessions related to this team
    console.log("[SERVER] DELETE /api/teams/[id] - Deleting sessions for team:", params.id)
    await sessionServer.deleteByTeamId(params.id)

    // Then delete the team
    console.log("[SERVER] DELETE /api/teams/[id] - Deleting team:", params.id)
    await teamServer.delete(params.id)

    console.log("[SERVER] DELETE /api/teams/[id] - Success")
    return NextResponse.json({ message: "Team and related sessions deleted successfully" })
  } catch (error) {
    console.error("[SERVER] DELETE /api/teams/[id] - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Failed to delete team", details: message }, { status: 500 })
  }
}
