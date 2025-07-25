import { supabase } from "@/lib/supabase/client"
import type { Session } from "@/lib/db/session-service"

export const sessionsApi = {
  async getAll(): Promise<Session[]> {
    const { data, error } = await supabase.from("session").select("*").order("startdate")

    if (error) {
      console.error("Error fetching sessions:", error)
      throw new Error(`Error fetching sessions: ${error.message}`)
    }

    return data || []
  },

  async getById(id: string): Promise<Session> {
    const { data, error } = await supabase.from("session").select("*").eq("sessionid", id).single()

    if (error) {
      console.error("Error fetching session:", error)
      throw new Error(`Error fetching session: ${error.message}`)
    }

    return data
  },

  async getByTeamId(teamId: string): Promise<Session[]> {
    const { data, error } = await supabase.from("session").select("*").eq("teamid", teamId).order("startdate")

    if (error) {
      console.error("Error fetching sessions by team:", error)
      throw new Error(`Error fetching sessions by team: ${error.message}`)
    }

    return data || []
  },

  async create(session: Omit<Session, "sessionid">): Promise<Session> {
    const { data, error } = await supabase.from("session").insert([session]).select().single()

    if (error) {
      console.error("Error creating session:", error)
      throw new Error(`Error creating session: ${error.message}`)
    }

    return data
  },

  async update(id: string, updates: Partial<Session>): Promise<Session> {
    const { data, error } = await supabase.from("session").update(updates).eq("sessionid", id).select().single()

    if (error) {
      console.error("Error updating session:", error)
      throw new Error(`Error updating session: ${error.message}`)
    }

    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("session").delete().eq("sessionid", id)

    if (error) {
      console.error("Error deleting session:", error)
      throw new Error(`Error deleting session: ${error.message}`)
    }
  },
}
