import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DateTime } from "luxon"
import { expandOccurrences } from "@/utils/schedule"
import type { TodaySessionsData, TodaySession } from "@/lib/api/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function formatTime(time: string): string {
  try {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  } catch {
    return time
  }
}

function getSessionStatus(startTime: Date, endTime: Date, now: DateTime): "active" | "upcoming" | "completed" {
  const nowMs = now.toMillis()
  const startMs = startTime.getTime()
  const endMs = endTime.getTime()
  
  if (nowMs >= startMs && nowMs <= endMs) {
    return "active"
  } else if (nowMs < startMs) {
    return "upcoming"
  } else {
    return "completed"
  }
}

export async function GET() {
  try {
    const zone = "America/New_York"
    const now = DateTime.now().setZone(zone)
    const todayStr = now.toFormat("yyyy-LL-dd")

    // Get all sessions with team and school information
    const { data: sessions, error: sessionsError } = await supabase
      .from("session")
      .select(`
        sessionid,
        startdate,
        enddate,
        starttime,
        endtime,
        daysofweek,
        cancel,
        teamid,
        team:teamid (
          teamid,
          name,
          school:schoolid (
            name
          )
        )
      `)

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError)
      throw new Error("Failed to fetch sessions")
    }

    // Process sessions to find today's occurrences
    const todaySessions: TodaySession[] = []

    for (const session of sessions || []) {
      // Skip if team or school data is missing
      if (!session.team || !session.team.school) continue

      // Expand occurrences for this session
      const occurrences = expandOccurrences({
        startdate: session.startdate,
        enddate: session.enddate,
        starttime: session.starttime,
        endtime: session.endtime,
        daysofweek: session.daysofweek,
        cancel: session.cancel,
      })

      // Check if any occurrence is today
      const todayOccurrences = occurrences.filter((occ) => {
        const occDate = DateTime.fromJSDate(occ.start, { zone }).toFormat("yyyy-LL-dd")
        return occDate === todayStr
      })

      // Add today's occurrences to the list
      for (const occ of todayOccurrences) {
        const status = getSessionStatus(occ.start, occ.end, now)
        
        todaySessions.push({
          sessionId: session.sessionid,
          teamId: session.teamid,
          teamName: session.team.name,
          schoolName: session.team.school.name,
          startTime: formatTime(session.starttime),
          endTime: formatTime(session.endtime),
          startDateTime: occ.start.toISOString(),
          endDateTime: occ.end.toISOString(),
          studentCount: 0, // Will be updated below
          status,
        })
      }
    }

    // Sort by start time
    todaySessions.sort((a, b) => 
      new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    )

    // Get enrollment counts for each team
    const uniqueTeamIds = [...new Set(todaySessions.map((s) => s.teamId))]
    const enrollmentCounts: Record<string, number> = {}

    if (uniqueTeamIds.length > 0) {
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollment")
        .select("enrollmentid, teamid")
        .in("teamid", uniqueTeamIds)
        .eq("isactive", true)

      if (enrollError) {
        console.error("Error fetching enrollments:", enrollError)
      } else {
        // Count enrollments per team
        for (const enrollment of enrollments || []) {
          enrollmentCounts[enrollment.teamid] = (enrollmentCounts[enrollment.teamid] || 0) + 1
        }
      }
    }

    // Update student counts
    for (const session of todaySessions) {
      session.studentCount = enrollmentCounts[session.teamId] || 0
    }

    const data: TodaySessionsData = {
      sessions: todaySessions,
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/sessions-today:", error)
    return NextResponse.json(
      { error: "Failed to fetch today's sessions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
