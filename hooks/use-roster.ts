"use client"

import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"

export interface RosterData {
  team: {
    teamid: string
    name: string
    sport: string | null
    description: string | null
    price: number | null
    school: {
      schoolid: number
      name: string
      location: string
    }
  }
  sessions: Array<{
    sessionid: string
    daysofweek: string
    starttime: string
    endtime: string
    startdate: string | null
    enddate: string | null
    staff: {
      id: string
      name: string
      email: string
      phone: string
    } | null
  }>
  enrollments: Array<{
    enrollmentid: string
    teamid: string
    studentid: string
    isactive: boolean
    student: {
      studentid: string
      firstname: string
      lastname: string
      grade: string
      dob: string | null
      level: string | null
      Level: string | null
      ecname: string | null
      ecphone: string | null
      ecrelationship: string | null
      teacher: string | null
      medcondition: string | null
      studentdismisall: string | null
      StudentDismisall: string | null
      uniform_size: string | null
      parent: {
        parentid: string
        firstname: string
        lastname: string
        email: string
        phone: string
      }
    }
  }>
}

async function fetchRoster(teamId: string): Promise<RosterData> {
  console.log("[fetchRoster] Starting fetch for team:", teamId)

  // Fetch team data
  const { data: team, error: teamError } = await supabase
    .from("team")
    .select(
      `
      *,
      school:schoolid (
        schoolid,
        name,
        location
      )
    `
    )
    .eq("teamid", teamId)
    .single()

  if (teamError) {
    console.error("[fetchRoster] Team error:", teamError)
    throw new Error(`Failed to fetch team: ${teamError.message}`)
  }

  console.log("[fetchRoster] Team data:", team)

  // Fetch sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from("session")
    .select(
      `
      *,
      staff:coachid (*)
    `
    )
    .eq("teamid", teamId)
    .order("daysofweek", { ascending: true })

  if (sessionsError) {
    console.error("[fetchRoster] Sessions error:", sessionsError)
    throw new Error(`Failed to fetch sessions: ${sessionsError.message}`)
  }

  console.log("[fetchRoster] Sessions data:", sessions)

  // Fetch enrollments with student and parent data
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollment")
    .select(
      `
      *,
      student:studentid (
        *,
        parent:parentid (*)
      )
    `
    )
    .eq("teamid", teamId)
    .eq("isactive", true)

  if (enrollmentsError) {
    console.error("[fetchRoster] Enrollments error:", enrollmentsError)
    throw new Error(`Failed to fetch enrollments: ${enrollmentsError.message}`)
  }

  console.log("[fetchRoster] Enrollments data:", enrollments)
  if (enrollments && enrollments.length > 0) {
    console.log("[fetchRoster] Sample student level data:", {
      student: enrollments[0].student?.firstname,
      level_minuscula: enrollments[0].student?.level,
      Level_mayuscula: enrollments[0].student?.Level,
    })
  }
  console.log("[fetchRoster] Success! Returning roster with", enrollments?.length || 0, "enrollments")

  return {
    team,
    sessions: sessions || [],
    enrollments: enrollments || [],
  }
}

export function useRoster(teamId: string | null) {
  return useQuery({
    queryKey: ["roster", teamId],
    queryFn: () => (teamId ? fetchRoster(teamId) : Promise.reject(new Error("No team ID provided"))),
    enabled: !!teamId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: false, // Only refetch if stale
    refetchOnWindowFocus: false,
    retry: 2, // Retry twice on error
  })
}


