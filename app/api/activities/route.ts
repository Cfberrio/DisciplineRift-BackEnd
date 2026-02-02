import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DateTime } from "luxon"
import type { ActivityData } from "@/lib/api/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function getRelativeTime(timestamp: string): string {
  const zone = "America/New_York"
  const now = DateTime.now().setZone(zone)
  const date = DateTime.fromISO(timestamp, { zone })
  
  const diff = now.diff(date, ["days", "hours", "minutes"])
  
  if (diff.days >= 1) {
    const days = Math.floor(diff.days)
    return `${days} day${days !== 1 ? "s" : ""} ago`
  } else if (diff.hours >= 1) {
    const hours = Math.floor(diff.hours)
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`
  } else if (diff.minutes >= 1) {
    const minutes = Math.floor(diff.minutes)
    return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
  } else {
    return "Just now"
  }
}

export async function GET() {
  try {
    // Get recent enrollments with student and team information
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollment")
      .select(`
        enrollmentid,
        created_at,
        student:studentid (
          firstname,
          lastname
        ),
        team:teamid (
          name
        )
      `)
      .eq("isactive", true)
      .order("created_at", { ascending: false })
      .limit(10)

    if (enrollError) {
      console.error("Error fetching enrollments:", enrollError)
      throw new Error("Failed to fetch enrollments")
    }

    // Map enrollments to activity items
    const items = (enrollments || [])
      .filter((enrollment) => enrollment.student && enrollment.team)
      .map((enrollment) => ({
        id: enrollment.enrollmentid,
        type: "enrollment" as const,
        studentName: `${enrollment.student.firstname} ${enrollment.student.lastname}`,
        teamName: enrollment.team.name,
        timestamp: enrollment.created_at,
        relativeTime: getRelativeTime(enrollment.created_at),
      }))

    const activityData: ActivityData = {
      items,
    }

    return NextResponse.json(activityData)
  } catch (error) {
    console.error("Error in GET /api/activities:", error)
    return NextResponse.json(
      { error: "Failed to fetch activity data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
