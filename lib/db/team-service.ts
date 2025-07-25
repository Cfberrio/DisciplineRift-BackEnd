import { supabase } from "@/lib/supabase/client"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface Team {
  teamid: string
  schoolid: number
  name: string
  description: string
  price: number
  participants: number
  isactive: boolean
  created_at?: string
  updated_at?: string
}

export interface CreateTeamData {
  schoolid: number
  name: string
  description: string
  price: number
  participants: number
  isactive: boolean
}

export interface UpdateTeamData {
  schoolid?: number
  name?: string
  description?: string
  price?: number
  participants?: number
  isactive?: boolean
}

class TeamService {
  // Client-side operations
  async getAll(): Promise<Team[]> {
    try {
      console.log("[CLIENT] Fetching teams from client...")
      const { data, error } = await supabase.from("team").select("*").order("teamid", { ascending: false })

      if (error) {
        console.error("[CLIENT] Supabase error fetching teams:", error)
        throw new Error(`Failed to fetch teams: ${error.message}`)
      }

      console.log("[CLIENT] Teams fetched successfully:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("[CLIENT] Error in teamClient.getAll:", error)
      throw error
    }
  }

  async getById(id: string): Promise<Team | null> {
    try {
      console.log("[CLIENT] Fetching team by ID:", id)
      const { data, error } = await supabase.from("team").select("*").eq("teamid", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null // Team not found
        }
        console.error("[CLIENT] Supabase error fetching team:", error)
        throw new Error(`Failed to fetch team: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("[CLIENT] Error in teamClient.getById:", error)
      throw error
    }
  }

  // Server-side operations
  async getAllServer(): Promise<Team[]> {
    try {
      console.log("[SERVER] Fetching all teams")
      const serverClient = await createServerSupabaseClient()

      const { data, error } = await serverClient.from("team").select("*").order("teamid", { ascending: true })

      if (error) {
        console.error("[SERVER] Supabase error fetching teams:", error.message)
        throw new Error(`Error fetching teams: ${error.message}`)
      }

      console.log("[SERVER] Teams fetched successfully:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("[SERVER] Error in teamServer.getAllServer:", error)
      throw error
    }
  }

  async getByIdServer(teamid: string): Promise<Team | null> {
    try {
      console.log("[SERVER] Fetching team by ID:", teamid)
      const serverClient = await createServerSupabaseClient()

      const { data, error } = await serverClient.from("team").select("*").eq("teamid", teamid).single()

      if (error) {
        if (error.code === "PGRST116") {
          console.log("[SERVER] Team not found:", teamid)
          return null
        }
        console.error("[SERVER] Supabase error fetching team:", error.message)
        throw new Error(`Error fetching team: ${error.message}`)
      }

      console.log("[SERVER] Team fetched successfully:", data?.teamid)
      return data
    } catch (error) {
      console.error("[SERVER] Error in teamServer.getByIdServer:", error)
      throw error
    }
  }

  async create(teamData: CreateTeamData): Promise<Team> {
    try {
      console.log("[SERVER] Creating team with data:", JSON.stringify(teamData, null, 2))

      // Validate required fields
      if (!teamData.name || !teamData.schoolid) {
        throw new Error("Name and school ID are required")
      }

      const serverClient = await createServerSupabaseClient()

      // Prepare the data for insertion - ensure schoolid is correctly set
      const insertData = {
        schoolid: Number(teamData.schoolid), // Make sure this is the correct schoolid
        name: teamData.name.trim(),
        description: teamData.description?.trim() || "",
        price: Number(teamData.price) || 0,
        participants: Number(teamData.participants) || 20,
        isactive: Boolean(teamData.isactive),
      }

      console.log("[SERVER] Prepared insert data:", JSON.stringify(insertData, null, 2))

      // Insert the team
      const { data, error } = await serverClient.from("team").insert([insertData]).select().single()

      if (error) {
        console.error("[SERVER] Supabase error creating team:", error)
        throw new Error(`Error creating team: ${error.message}`)
      }

      if (!data) {
        throw new Error("No data returned from team creation")
      }

      console.log("[SERVER] Team created successfully:", JSON.stringify(data, null, 2))
      return data
    } catch (error) {
      console.error("[SERVER] Error in teamServer.create:", error)
      throw error
    }
  }

  async update(id: string, teamData: UpdateTeamData): Promise<Team> {
    try {
      console.log("[SERVER] Updating team:", id, JSON.stringify(teamData))

      const serverClient = await createServerSupabaseClient()

      const updateData: any = {}
      if (teamData.schoolid !== undefined) updateData.schoolid = Number(teamData.schoolid)
      if (teamData.name !== undefined) updateData.name = teamData.name.trim()
      if (teamData.description !== undefined) updateData.description = teamData.description.trim()
      if (teamData.price !== undefined) updateData.price = Number(teamData.price)
      if (teamData.participants !== undefined) updateData.participants = Number(teamData.participants)
      if (teamData.isactive !== undefined) updateData.isactive = Boolean(teamData.isactive)

      console.log("[SERVER] Prepared update data:", JSON.stringify(updateData))

      const { data, error } = await serverClient.from("team").update(updateData).eq("teamid", id).select().single()

      if (error) {
        console.error("[SERVER] Supabase error updating team:", error)
        throw new Error(`Error updating team: ${error.message}`)
      }

      if (!data) {
        throw new Error("Team not found or no data returned")
      }

      console.log("[SERVER] Team updated successfully:", JSON.stringify(data))
      return data
    } catch (error) {
      console.error("[SERVER] Error in teamServer.update:", error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log("[SERVER] Deleting team:", id)

      const serverClient = await createServerSupabaseClient()

      const { error } = await serverClient.from("team").delete().eq("teamid", id)

      if (error) {
        console.error("[SERVER] Supabase error deleting team:", error)
        throw new Error(`Error deleting team: ${error.message}`)
      }

      console.log("[SERVER] Team deleted successfully")
    } catch (error) {
      console.error("[SERVER] Error in teamServer.delete:", error)
      throw error
    }
  }
}

// Export instances for client and server use
export const teamClient = new TeamService()
export const teamServer = new TeamService()
