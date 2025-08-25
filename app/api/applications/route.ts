import { NextRequest, NextResponse } from "next/server"
import { drteamService } from "@/lib/db/drteam-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      search: searchParams.get("search") || "",
      sport: searchParams.get("sport") || "",
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20")
    }

    const result = await drteamService.getAllApplications(filters)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in /api/applications:", error)
    return NextResponse.json(
      { error: "Error fetching applications" },
      { status: 500 }
    )
  }
}
