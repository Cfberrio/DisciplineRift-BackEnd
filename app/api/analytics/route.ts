import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { DateTime } from "luxon"
import { expandOccurrences } from "@/utils/schedule"
import type { AnalyticsData } from "@/lib/api/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const zone = "America/New_York"
    const now = DateTime.now().setZone(zone)
    const todayStr = now.toFormat("yyyy-LL-dd")

    // Get all sessions
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

    // Filter sessions that have occurrences today
    const todaySessions: Array<{
      sessionid: string
      teamid: string
      teamName: string
      startTime: Date
      endTime: Date
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
        })
      }
    }

    // Sort by start time
    todaySessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    // Count active sessions (currently happening)
    const activeSessions = todaySessions.filter((session) => {
      const nowMs = now.toMillis()
      const startMs = session.startTime.getTime()
      const endMs = session.endTime.getTime()
      return nowMs >= startMs && nowMs <= endMs
    }).length

    // Find next session
    let nextSessionTime: string | null = null
    const upcomingSessions = todaySessions.filter((session) => {
      return session.startTime.getTime() > now.toMillis()
    })

    if (upcomingSessions.length > 0) {
      const nextSession = upcomingSessions[0]
      const nextStart = DateTime.fromJSDate(nextSession.startTime, { zone })
      const diff = nextStart.diff(now, ["hours", "minutes"])

      if (diff.hours > 0) {
        nextSessionTime = `In ${Math.floor(diff.hours)} hour${Math.floor(diff.hours) !== 1 ? "s" : ""}`
      } else if (diff.minutes > 0) {
        nextSessionTime = `In ${Math.floor(diff.minutes)} minute${Math.floor(diff.minutes) !== 1 ? "s" : ""}`
      } else {
        nextSessionTime = "Soon"
      }
    }

    // Count total students expected (enrolled in today's sessions)
    const uniqueTeamIds = [...new Set(todaySessions.map((s) => s.teamid))]
    let totalStudents = 0

    if (uniqueTeamIds.length > 0) {
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollment")
        .select("enrollmentid, teamid")
        .in("teamid", uniqueTeamIds)
        .eq("isactive", true)

      if (enrollError) {
        console.error("Error fetching enrollments:", enrollError)
      } else {
        totalStudents = enrollments?.length || 0
      }
    }

    const analyticsData: AnalyticsData = {
      sessionsToday: todaySessions.length,
      studentsExpected: totalStudents,
      activeSessions: activeSessions,
      nextSessionTime: nextSessionTime,
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Error in GET /api/analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
