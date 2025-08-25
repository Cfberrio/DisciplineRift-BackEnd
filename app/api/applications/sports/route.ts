import { NextResponse } from "next/server"
import { drteamService } from "@/lib/db/drteam-service"

export async function GET() {
  try {
    const sports = await drteamService.getSports()
    
    return NextResponse.json({ sports })
  } catch (error) {
    console.error("Error in /api/applications/sports:", error)
    return NextResponse.json(
      { error: "Error fetching sports" },
      { status: 500 }
    )
  }
}
