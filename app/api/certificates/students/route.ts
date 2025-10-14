import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sport = searchParams.get("sport")
    const teamid = searchParams.get("teamid")

    if (!sport) {
      return NextResponse.json(
        { error: "Sport parameter is required" },
        { status: 400 }
      )
    }

    // If only sport is provided, return teams for that sport
    if (!teamid) {
      console.log("[API /api/certificates/students] Fetching teams for sport:", sport)

      const { data: teams, error: teamsError } = await supabase
        .from("team")
        .select("teamid, name, sport")
        .eq("sport", sport)
        .eq("isactive", true)
        .eq("isongoing", false)
        .order("name", { ascending: true })

      if (teamsError) {
        console.error("[API /api/certificates/students] Error fetching teams:", teamsError)
        return NextResponse.json(
          { error: "Error fetching teams", details: teamsError.message },
          { status: 500 }
        )
      }

      console.log("[API /api/certificates/students] Found teams:", teams?.length || 0)

      return NextResponse.json({
        teams: teams || [],
      })
    }

    // If both sport and teamid are provided, return students for that team
    console.log("[API /api/certificates/students] Fetching students for team:", teamid)

    // 1. Verify team exists and matches sport
    const { data: team, error: teamError } = await supabase
      .from("team")
      .select("teamid, name, sport")
      .eq("teamid", teamid)
      .eq("sport", sport)
      .eq("isactive", true)
      .eq("isongoing", false)
      .single()

    if (teamError || !team) {
      console.error("[API /api/certificates/students] Team not found or not eligible:", teamError)
      return NextResponse.json(
        { error: "Team not found or not eligible" },
        { status: 404 }
      )
    }

    // 2. Get active enrollments for this team
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollment")
      .select("studentid")
      .eq("teamid", teamid)
      .eq("isactive", true)

    if (enrollmentsError) {
      console.error("[API /api/certificates/students] Error fetching enrollments:", enrollmentsError)
      return NextResponse.json(
        { error: "Error fetching enrollments", details: enrollmentsError.message },
        { status: 500 }
      )
    }

    if (!enrollments || enrollments.length === 0) {
      console.log("[API /api/certificates/students] No active enrollments found")
      return NextResponse.json({ students: [], team })
    }

    const studentIds = enrollments.map((e) => e.studentid)
    console.log("[API /api/certificates/students] Found students:", studentIds.length)

    // 3. Get student details
    const { data: students, error: studentsError } = await supabase
      .from("student")
      .select("studentid, firstname, lastname, grade, Level")
      .in("studentid", studentIds)
      .order("lastname", { ascending: true })
      .order("firstname", { ascending: true })

    if (studentsError) {
      console.error("[API /api/certificates/students] Error fetching students:", studentsError)
      return NextResponse.json(
        { error: "Error fetching students", details: studentsError.message },
        { status: 500 }
      )
    }

    console.log("[API /api/certificates/students] Successfully fetched", students?.length || 0, "students")

    return NextResponse.json({
      students: students || [],
      team,
      totalStudents: students?.length || 0,
    })
  } catch (error) {
    console.error("[API /api/certificates/students] Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

