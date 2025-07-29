import { type NextRequest, NextResponse } from "next/server";
import { sessionServer } from "@/lib/db/session-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamid = searchParams.get("teamid");

    let sessions;
    if (teamid) {
      sessions = await sessionServer.getByTeamId(teamid);
    } else {
      sessions = await sessionServer.getAll();
    }

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[SERVER] GET /api/sessions - Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch sessions", details: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.teamid || !body.startdate || !body.starttime || !body.endtime) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "teamid, startdate, starttime, and endtime are required",
        },
        { status: 400 }
      );
    }

    const session = await sessionServer.create(body);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("[SERVER] POST /api/sessions - Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create session", details: message },
      { status: 500 }
    );
  }
}
