"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

// Types
export interface Enrollment {
  enrollmentid: string
  teamid: string
  studentid: string
  isactive: boolean
  student?: {
    studentid: string
    firstname: string
    lastname: string
    grade: string
    dob: string | null
    parentid: string
    ecname: string | null
    ecphone: string | null
    ecrelationship: string | null
    teacher: string | null
    medcondition: string | null
    studentdismisall: string | null
    StudentDismisall: string | null
    parent?: {
      parentid: string
      firstname: string
      lastname: string
      email: string
      phone: string
    }
  }
}

export interface AvailableStudent {
  studentid: string
  firstname: string
  lastname: string
  grade: string
  dob: string | null
  parentid: string
  parent?: {
    parentid: string
    firstname: string
    lastname: string
    email: string
    phone: string
  }
}

// Fetch enrollments for a team
async function fetchEnrollments(teamId: string) {
  console.log("[fetchEnrollments] Fetching enrollments for team:", teamId)

  const { data, error } = await supabase
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

  if (error) {
    console.error("[fetchEnrollments] Error:", error)
    throw new Error(error.message)
  }

  console.log("[fetchEnrollments] Success! Found", data?.length || 0, "enrollments")
  console.log("[fetchEnrollments] Data:", data)

  return data || []
}

// Fetch students not enrolled in this team
async function fetchAvailableStudents(teamId: string, schoolId: number) {
  // Get all students from the same school
  const { data: allStudents, error: studentsError } = await supabase
    .from("student")
    .select(
      `
      *,
      parent:parentid (*)
    `
    )
    .order("firstname", { ascending: true })

  if (studentsError) {
    throw new Error(studentsError.message)
  }

  // Get already enrolled students
  const { data: enrolledStudents, error: enrolledError } = await supabase
    .from("enrollment")
    .select("studentid")
    .eq("teamid", teamId)
    .eq("isactive", true)

  if (enrolledError) {
    throw new Error(enrolledError.message)
  }

  const enrolledIds = new Set(enrolledStudents?.map((e) => e.studentid) || [])

  // Filter out already enrolled students
  const available = allStudents?.filter((s) => !enrolledIds.has(s.studentid)) || []

  return available
}

// Hooks
export function useEnrollments(teamId: string | null) {
  return useQuery({
    queryKey: ["enrollments", teamId],
    queryFn: () => (teamId ? fetchEnrollments(teamId) : Promise.resolve([])),
    enabled: !!teamId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: false, // Only refetch if stale
    refetchOnWindowFocus: false,
  })
}

export function useAvailableStudents(teamId: string | null, schoolId: number | null) {
  return useQuery({
    queryKey: ["available-students", teamId, schoolId],
    queryFn: () =>
      teamId && schoolId
        ? fetchAvailableStudents(teamId, schoolId)
        : Promise.resolve([]),
    enabled: !!teamId && !!schoolId,
    staleTime: 60 * 1000, // 1 minute
    refetchOnMount: false, // Only refetch if stale
    refetchOnWindowFocus: false,
  })
}

export function useEnrollStudent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      teamid,
      studentid,
    }: {
      teamid: string
      studentid: string
    }) => {
      // Check if already enrolled
      const { data: existing, error: existingError } = await supabase
        .from("enrollment")
        .select("enrollmentid")
        .eq("teamid", teamid)
        .eq("studentid", studentid)
        .eq("isactive", true)
        .maybeSingle()

      if (existingError) {
        throw new Error("Failed to check existing enrollment")
      }

      if (existing) {
        throw new Error("Student is already enrolled in this team")
      }

      // Use client-side Supabase (with user session)
      const { data, error } = await supabase
        .from("enrollment")
        .insert({
          teamid,
          studentid,
          isactive: true,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || "Failed to enroll student")
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["enrollments", data.teamid],
        refetchType: "active"
      })
      queryClient.invalidateQueries({
        queryKey: ["available-students", data.teamid],
        refetchType: "active"
      })
      queryClient.invalidateQueries({ 
        queryKey: ["roster", data.teamid],
        refetchType: "active"
      })
      queryClient.invalidateQueries({ 
        queryKey: ["team-stats"],
        refetchType: "active"
      })
      queryClient.invalidateQueries({ 
        queryKey: ["teams"],
        refetchType: "active"
      })
      toast({
        title: "Success",
        description: "Student enrolled successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export function useUnenrollStudent() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      enrollmentid,
      teamid,
    }: {
      enrollmentid: string
      teamid: string
    }) => {
      // Soft delete by setting isactive to false (use client-side Supabase)
      const { data, error } = await supabase
        .from("enrollment")
        .update({ isactive: false })
        .eq("enrollmentid", enrollmentid)
        .select()
        .single()

      if (error) {
        throw new Error(error.message || "Failed to unenroll student")
      }

      return { enrollmentid, teamid }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["enrollments", data.teamid],
        refetchType: "active"
      })
      queryClient.invalidateQueries({
        queryKey: ["available-students", data.teamid],
        refetchType: "active"
      })
      queryClient.invalidateQueries({ 
        queryKey: ["roster", data.teamid],
        refetchType: "active"
      })
      queryClient.invalidateQueries({ 
        queryKey: ["team-stats"],
        refetchType: "active"
      })
      queryClient.invalidateQueries({ 
        queryKey: ["teams"],
        refetchType: "active"
      })
      toast({
        title: "Success",
        description: "Student unenrolled successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}


