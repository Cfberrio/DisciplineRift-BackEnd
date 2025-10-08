import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sport = searchParams.get("sport")

    if (!sport) {
      return NextResponse.json(
        { error: "Sport parameter is required" },
        { status: 400 }
      )
    }

    console.log("[API /api/certificates/students] Fetching students for sport:", sport)

    // 1. Get teams with the specified sport, isactive=true, and isongoing=false
    const { data: teams, error: teamsError } = await supabase
      .from("team")
      .select("teamid, name, sport")
      .eq("sport", sport)
      .eq("isactive", true)
      .eq("isongoing", false)

    if (teamsError) {
      console.error("[API /api/certificates/students] Error fetching teams:", teamsError)
      return NextResponse.json(
        { error: "Error fetching teams", details: teamsError.message },
        { status: 500 }
      )
    }

    if (!teams || teams.length === 0) {
      console.log("[API /api/certificates/students] No eligible teams found for sport:", sport)
      return NextResponse.json({ students: [] })
    }

    const teamIds = teams.map((team) => team.teamid)
    console.log("[API /api/certificates/students] Found eligible teams:", teamIds)

    // 2. Get active enrollments for these teams
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("enrollment")
      .select("studentid, teamid")
      .in("teamid", teamIds)
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
      return NextResponse.json({ students: [] })
    }

    const studentIds = [...new Set(enrollments.map((e) => e.studentid))]
    console.log("[API /api/certificates/students] Found students:", studentIds.length)

    // 3. Get student details
    const { data: students, error: studentsError } = await supabase
      .from("student")
      .select("studentid, firstname, lastname, grade, Level")
      .in("studentid", studentIds)

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
      teams: teams,
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

