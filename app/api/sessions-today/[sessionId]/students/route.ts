import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { SessionStudentsData } from "@/lib/api/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId

    // Get the team ID for this session
    const { data: session, error: sessionError } = await supabase
      .from("session")
      .select("teamid")
      .eq("sessionid", sessionId)
      .single()

    if (sessionError || !session) {
      console.error("Error fetching session:", sessionError)
      throw new Error("Session not found")
    }

    // Get all active enrollments for this team with student details
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollment")
      .select(`
        enrollmentid,
        student:studentid (
          studentid,
          firstname,
          lastname,
          grade,
          level,
          Level
        )
      `)
      .eq("teamid", session.teamid)
      .eq("isactive", true)
      .order("student(lastname)", { ascending: true })

    if (enrollError) {
      console.error("Error fetching enrollments:", enrollError)
      throw new Error("Failed to fetch students")
    }

    // Map to student data
    const students = (enrollments || [])
      .filter((enrollment) => enrollment.student)
      .map((enrollment) => ({
        studentId: enrollment.student.studentid,
        firstName: enrollment.student.firstname,
        lastName: enrollment.student.lastname,
        grade: enrollment.student.grade,
        level: enrollment.student.level || enrollment.student.Level || null,
      }))

    const data: SessionStudentsData = {
      students,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/sessions-today/[sessionId]/students:", error)
    return NextResponse.json(
      { error: "Failed to fetch students", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
