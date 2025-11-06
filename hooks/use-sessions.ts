"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

// Types
export interface Session {
  sessionid: string
  teamid: string
  daysofweek: string
  starttime: string
  endtime: string
  startdate: string | null
  enddate: string | null
  coachid: string | null
  repeat?: string
  created_at?: string
  updated_at?: string
  staff?: {
    id: string
    name: string
    email: string
    phone: string
  }
}

export interface CreateSessionInput {
  teamid: string
  daysofweek: string
  starttime: string
  endtime: string
  startdate?: string
  enddate?: string
  coachid?: string
  repeat?: string
}

export interface UpdateSessionInput extends Partial<CreateSessionInput> {
  sessionid: string
}

// Fetch sessions for a team
async function fetchSessions(teamId: string) {
  const { data, error } = await supabase
    .from("session")
    .select(
      `
      *,
      staff:coachid (*)
    `
    )
    .eq("teamid", teamId)
    .order("daysofweek", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

// Hooks
export function useSessions(teamId: string | null) {
  return useQuery({
    queryKey: ["sessions", teamId],
    queryFn: () => (teamId ? fetchSessions(teamId) : Promise.resolve([])),
    enabled: !!teamId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: false, // Only refetch if stale
    refetchOnWindowFocus: false,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (input: CreateSessionInput) => {
      // Use client-side Supabase (with user session)
      const { data, error } = await supabase
        .from("session")
        .insert({
          teamid: input.teamid,
          daysofweek: input.daysofweek,
          starttime: input.starttime,
          endtime: input.endtime,
          startdate: input.startdate || null,
          enddate: input.enddate || null,
          coachid: input.coachid || null,
          repeat: input.repeat || "weekly",
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message || "Failed to create session")
      }

      return data
    },
    onSuccess: (data) => {
      // Refetch active queries immediately to update UI
      queryClient.invalidateQueries({ 
        queryKey: ["sessions", data.teamid],
        refetchType: "active"
      })
      // Also invalidate roster data if viewing it
      queryClient.invalidateQueries({ 
        queryKey: ["roster", data.teamid],
        refetchType: "active"
      })
      toast({
        title: "Success",
        description: "Session created successfully",
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

export function useUpdateSession() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (input: UpdateSessionInput) => {
      const { sessionid, ...updateData } = input

      // Build update object
      const dataToUpdate: any = {}
      if (updateData.daysofweek !== undefined) dataToUpdate.daysofweek = updateData.daysofweek
      if (updateData.starttime !== undefined) dataToUpdate.starttime = updateData.starttime
      if (updateData.endtime !== undefined) dataToUpdate.endtime = updateData.endtime
      if (updateData.startdate !== undefined) dataToUpdate.startdate = updateData.startdate || null
      if (updateData.enddate !== undefined) dataToUpdate.enddate = updateData.enddate || null
      if (updateData.coachid !== undefined) dataToUpdate.coachid = updateData.coachid || null
      if (updateData.repeat !== undefined) dataToUpdate.repeat = updateData.repeat || "weekly"

      // Use client-side Supabase (with user session)
      const { data, error } = await supabase
        .from("session")
        .update(dataToUpdate)
        .eq("sessionid", sessionid)
        .select()
        .single()

      if (error) {
        throw new Error(error.message || "Failed to update session")
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["sessions", data.teamid],
        refetchType: "active"
      })
      queryClient.invalidateQueries({ 
        queryKey: ["roster", data.teamid],
        refetchType: "active"
      })
      toast({
        title: "Success",
        description: "Session updated successfully",
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

export function useDeleteSession() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      sessionid,
      teamid,
    }: {
      sessionid: string
      teamid: string
    }) => {
      // Use client-side Supabase (with user session)
      const { error } = await supabase
        .from("session")
        .delete()
        .eq("sessionid", sessionid)

      if (error) {
        throw new Error(error.message || "Failed to delete session")
      }

      return { sessionid, teamid }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["sessions", data.teamid],
        refetchType: "active"
      })
      queryClient.invalidateQueries({ 
        queryKey: ["roster", data.teamid],
        refetchType: "active"
      })
      toast({
        title: "Success",
        description: "Session deleted successfully",
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


