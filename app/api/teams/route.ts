import { type NextRequest, NextResponse } from "next/server";
import { teamServer } from "@/lib/db/team-service";

export async function GET() {
  try {
    const teams = await teamServer.getAllServer();
    return NextResponse.json(teams);
  } catch (error) {
    console.error("[SERVER] GET /api/teams - Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch teams", details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.schoolid) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "Name and schoolid are required",
        },
        { status: 400 }
      );
    }

    const team = await teamServer.create(body);

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("[SERVER] POST /api/teams - Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create team", details: message },
      { status: 500 }
    );
  }
}
