"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

// Types
export interface Team {
  teamid: string
  name: string
  sport: string | null
  description: string | null
  price: number | null
  participants: number
  isactive: boolean
  isongoing: boolean
  status?: string | null
  schoolid: number
  created_at?: string
  updated_at?: string
  school?: {
    schoolid: number
    name: string
    location: string
  }
  sessions?: Array<{
    sessionid: string
    daysofweek: string
    starttime: string
    endtime: string
    coachid: string | null
    staff?: {
      id: string
      name: string
    }
  }>
  _count?: {
    enrollments: number
  }
}

export interface TeamFilters {
  search?: string
  schoolId?: number
  sport?: string
  status?: string
}

export interface CreateTeamInput {
  name: string
  sport?: string
  description?: string
  price?: number
  participants: number
  status?: string
  schoolid: number
}

export interface UpdateTeamInput extends Partial<CreateTeamInput> {
  teamid: string
}

// Fetch teams with filters and pagination
async function fetchTeams(
  filters: TeamFilters = {},
  page: number = 1,
  pageSize: number = 20
) {
  let query = supabase
    .from("team")
    .select(
      `
      *,
      school:schoolid (
        schoolid,
        name,
        location
      )
    `,
      { count: "exact" }
    )
    .order("isactive", { ascending: false }) // Active teams first
    .order("name", { ascending: true }) // Then by name

  // Apply filters
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`)
  }

  if (filters.schoolId) {
    query = query.eq("schoolid", filters.schoolId)
  }

  if (filters.sport) {
    query = query.eq("sport", filters.sport)
  }

  if (filters.isactive !== undefined) {
    query = query.eq("isactive", filters.isactive)
  }

  if (filters.isongoing !== undefined) {
    query = query.eq("isongoing", filters.isongoing)
  }

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    throw new Error(error.message)
  }

  // Fetch enrollment counts for each team
  const teamIds = data?.map((t) => t.teamid) || []
  const { data: enrollmentCounts } = await supabase
    .from("enrollment")
    .select("teamid")
    .in("teamid", teamIds)
    .eq("isactive", true)

  // Group enrollments by team
  const enrollmentsByTeam = enrollmentCounts?.reduce(
    (acc, e) => {
      acc[e.teamid] = (acc[e.teamid] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  ) || {}

  // Add enrollment count to teams
  const teamsWithCounts = data?.map((team) => ({
    ...team,
    _count: {
      enrollments: enrollmentsByTeam[team.teamid] || 0,
    },
  }))

  return {
    teams: teamsWithCounts || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

// Fetch single team by ID
async function fetchTeamById(teamId: string) {
  const { data, error } = await supabase
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

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Fetch team statistics
async function fetchTeamStats() {
  const { data: teams, error: teamsError } = await supabase
    .from("team")
    .select("teamid, isactive, isongoing")

  if (teamsError) throw new Error(teamsError.message)

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("enrollment")
    .select("enrollmentid, isactive")
    .eq("isactive", true)

  if (enrollmentsError) throw new Error(enrollmentsError.message)

  const activeTeams = teams?.filter((t) => t.isactive).length || 0
  const ongoingTeams = teams?.filter((t) => t.isongoing).length || 0
  const totalStudents = enrollments?.length || 0

  return {
    totalTeams: teams?.length || 0,
    activeTeams,
    ongoingTeams,
    totalStudents,
  }
}

// Hooks
export function useTeams(
  filters: TeamFilters = {}, 
  page: number = 1,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["teams", JSON.stringify(filters), page],
    queryFn: () => fetchTeams(filters, page, 20),
    staleTime: 60 * 1000, // 60 seconds
    refetchOnMount: false, // Only refetch if stale
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true, // Por defecto habilitado
  })
}

export function useTeam(teamId: string | null) {
  return useQuery({
    queryKey: ["team", teamId],
    queryFn: () => (teamId ? fetchTeamById(teamId) : Promise.resolve(null)),
    enabled: !!teamId,
    staleTime: 60 * 1000, // 60 seconds
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })
}

export function useTeamStats() {
  return useQuery({
    queryKey: ["team-stats"],
    queryFn: fetchTeamStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: false, // Only refetch if stale
    refetchOnWindowFocus: false,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (input: CreateTeamInput) => {
      // Use client-side Supabase (with user session) like services-context does
      const { data, error } = await supabase
        .from("team")
        .insert({
          name: input.name,
          sport: input.sport || null,
          description: input.description || null,
          price: input.price || null,
          participants: input.participants,
          status: input.status || "open",
          schoolid: input.schoolid,
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || "Failed to create team")
      }

      return data
    },
    onSuccess: () => {
      // Delay para permitir que el diálogo se cierre primero
      setTimeout(() => {
        // Use refetch type to avoid loops
        queryClient.invalidateQueries({ 
          queryKey: ["teams"],
          refetchType: "active"
        })
        queryClient.invalidateQueries({ 
          queryKey: ["team-stats"],
          refetchType: "active"
        })
        queryClient.invalidateQueries({ 
          queryKey: ["team"],
          refetchType: "active"
        })
      }, 100)
      
      toast({
        title: "Success",
        description: "Team created successfully",
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

export function useUpdateTeam() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (input: UpdateTeamInput) => {
      const { teamid, ...updateData } = input
      
      // Build update object
      const dataToUpdate: any = {}
      if (updateData.name !== undefined) dataToUpdate.name = updateData.name
      if (updateData.sport !== undefined) dataToUpdate.sport = updateData.sport || null
      if (updateData.description !== undefined) dataToUpdate.description = updateData.description || null
      if (updateData.price !== undefined) dataToUpdate.price = updateData.price || null
      if (updateData.participants !== undefined) dataToUpdate.participants = updateData.participants
      if (updateData.status !== undefined) dataToUpdate.status = updateData.status
      if (updateData.schoolid !== undefined) dataToUpdate.schoolid = updateData.schoolid

      // Use client-side Supabase (with user session)
      const { data, error } = await supabase
        .from("team")
        .update(dataToUpdate)
        .eq("teamid", teamid)
        .select()
        .single()

      if (error) {
        throw new Error(error.message || "Failed to update team")
      }

      return data
    },
    onSuccess: () => {
      // Delay para permitir que el diálogo se cierre primero
      setTimeout(() => {
        // Use refetch type to avoid loops
        queryClient.invalidateQueries({ 
          queryKey: ["teams"],
          refetchType: "active"
        })
        queryClient.invalidateQueries({ 
          queryKey: ["team-stats"],
          refetchType: "active"
        })
        // Invalidar el team específico actualizado
        queryClient.invalidateQueries({ 
          queryKey: ["team"],
          refetchType: "active"
        })
      }, 100)
      
      toast({
        title: "Success",
        description: "Team updated successfully",
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

export function useDeleteTeam() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (teamid: string) => {
      // Check if team has enrollments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("enrollment")
        .select("enrollmentid")
        .eq("teamid", teamid)
        .eq("isactive", true)
        .limit(1)

      if (enrollmentError) {
        throw new Error("Failed to check enrollments")
      }

      if (enrollments && enrollments.length > 0) {
        throw new Error("Cannot delete team with existing enrollments")
      }

      // Delete associated sessions first
      const { error: sessionsError } = await supabase
        .from("session")
        .delete()
        .eq("teamid", teamid)

      if (sessionsError) {
        throw new Error("Failed to delete team sessions")
      }

      // Delete team using client-side Supabase
      const { error } = await supabase
        .from("team")
        .delete()
        .eq("teamid", teamid)

      if (error) {
        throw new Error(error.message || "Failed to delete team")
      }

      return { success: true }
    },
    onSuccess: () => {
      // Use refetch type to avoid loops
      queryClient.invalidateQueries({ 
        queryKey: ["teams"],
        refetchType: "active"
      })
      queryClient.invalidateQueries({ 
        queryKey: ["team-stats"],
        refetchType: "active"
      })
      toast({
        title: "Success",
        description: "Team deleted successfully",
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

// Función para duplicar un team con sus sessions
async function duplicateTeamWithSessions(teamId: string) {
  // 1. Obtener el team original
  const { data: originalTeam, error: teamError } = await supabase
    .from("team")
    .select("*")
    .eq("teamid", teamId)
    .single()

  if (teamError || !originalTeam) {
    throw new Error("Failed to fetch original team")
  }

  // 2. Crear el nuevo team con nombre_duplicate
  const newTeamData = {
    name: `${originalTeam.name}_duplicate`,
    sport: originalTeam.sport,
    description: originalTeam.description,
    price: originalTeam.price,
    participants: originalTeam.participants,
    isactive: originalTeam.isactive,
    isongoing: originalTeam.isongoing,
    schoolid: originalTeam.schoolid,
  }

  const { data: newTeam, error: createError } = await supabase
    .from("team")
    .insert(newTeamData)
    .select()
    .single()

  if (createError || !newTeam) {
    throw new Error("Failed to create duplicate team")
  }

  // 3. Obtener todas las sessions del team original
  const { data: originalSessions, error: sessionsError } = await supabase
    .from("session")
    .select("*")
    .eq("teamid", teamId)

  if (sessionsError) {
    throw new Error("Failed to fetch original sessions")
  }

  // 4. Duplicar sessions si existen
  if (originalSessions && originalSessions.length > 0) {
    const newSessions = originalSessions.map((session) => ({
      teamid: newTeam.teamid,
      daysofweek: session.daysofweek,
      starttime: session.starttime,
      endtime: session.endtime,
      startdate: session.startdate,
      enddate: session.enddate,
      coachid: session.coachid,
      repeat: session.repeat,
    }))

    const { error: insertSessionsError } = await supabase
      .from("session")
      .insert(newSessions)

    if (insertSessionsError) {
      throw new Error("Failed to duplicate sessions")
    }
  }

  return newTeam
}

// Hook para duplicar team
export function useDuplicateTeam() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (teamId: string) => {
      return await duplicateTeamWithSessions(teamId)
    },
    onSuccess: (newTeam) => {
      // Delay para permitir que el UI se actualice primero
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ["teams"],
          refetchType: "active"
        })
        queryClient.invalidateQueries({ 
          queryKey: ["team-stats"],
          refetchType: "active"
        })
      }, 100)
      
      toast({
        title: "Success",
        description: `Team duplicated as "${newTeam.name}"`,
      })
      
      return newTeam
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

