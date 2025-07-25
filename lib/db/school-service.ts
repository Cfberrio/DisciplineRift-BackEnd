import { supabase } from "@/lib/supabase/client"
import { createServerSupabaseClient } from "../supabase/server"

export interface School {
  schoolid: number
  name: string
  location: string
}

export type CreateSchoolData = Omit<School, "schoolid">
export type UpdateSchoolData = Partial<CreateSchoolData>

// Client-side school functions
export const schoolClient = {
  /**
   * Get all schools
   */
  async getAll(): Promise<School[]> {
    const { data, error } = await supabase.from("school").select("*").order("name")

    if (error) {
      console.error("Error fetching schools:", error)
      return []
    }

    return data || []
  },

  /**
   * Get school by ID
   */
  async getById(id: number): Promise<School | null> {
    const { data, error } = await supabase.from("school").select("*").eq("schoolid", id).single()

    if (error) {
      console.error("Error fetching school:", error)
      return null
    }

    return data
  },
}

// Server-side school functions
export const schoolServer = {
  /**
   * Get all schools
   */
  async getAll(): Promise<School[]> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("school").select("*").order("name")

    if (error) {
      console.error("Error fetching schools:", error)
      return []
    }

    return data || []
  },

  /**
   * Get school by ID
   */
  async getById(id: number): Promise<School | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("school").select("*").eq("schoolid", id).single()

    if (error) {
      console.error("Error fetching school:", error)
      return null
    }

    return data
  },

  /**
   * Create new school
   */
  async create(school: CreateSchoolData): Promise<School | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("school").insert([school]).select().single()

    if (error) {
      console.error("Error creating school:", error)
      return null
    }

    return data
  },

  /**
   * Update school
   */
  async update(id: number, updates: UpdateSchoolData): Promise<School | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("school").update(updates).eq("schoolid", id).select().single()

    if (error) {
      console.error("Error updating school:", error)
      return null
    }

    return data
  },

  /**
   * Delete school
   */
  async delete(id: number): Promise<boolean> {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("school").delete().eq("schoolid", id)

    if (error) {
      console.error("Error deleting school:", error)
      return false
    }

    return true
  },
}
