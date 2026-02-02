import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DateTime } from "luxon"
import { expandOccurrences } from "@/utils/schedule"
import type { ScheduleData } from "@/lib/api/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function formatTime(time: string) {
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

export async function GET() {
  try {
    const zone = "America/New_York"
    const now = DateTime.now().setZone(zone)
    const todayStr = now.toFormat("yyyy-LL-dd")

    // Get all sessions with team information
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
          name
        )
      `)

    if (sessionsError) {
      console.error("Error fetching sessions:", sessionsError)
      throw new Error("Failed to fetch sessions")
    }

    // Process sessions to find today's occurrences
    const todaySessions: Array<{
      sessionid: string
      teamid: string
      teamName: string
      startTime: Date
      endTime: Date
      startTimeStr: string
    }> = []

    for (const session of sessions || []) {
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
        todaySessions.push({
          sessionid: session.sessionid,
          teamid: session.teamid,
          teamName: session.team?.name || "Unknown Team",
          startTime: occ.start,
          endTime: occ.end,
          startTimeStr: session.starttime,
        })
      }
    }

    // Sort by start time
    todaySessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    // Get enrollment counts for each team
    const uniqueTeamIds = [...new Set(todaySessions.map((s) => s.teamid))]
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

    // Build the events array
    const events = todaySessions.map((session, index) => ({
      id: `${session.sessionid}-${index}`,
      title: session.teamName,
      time: formatTime(session.startTimeStr),
      participants: enrollmentCounts[session.teamid] || 0,
      sessionId: session.sessionid,
    }))

    const scheduleData: ScheduleData = {
      events,
    }

    return NextResponse.json(scheduleData)
  } catch (error) {
    console.error("Error in GET /api/schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
