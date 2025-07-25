import { createClient } from "../supabase/client"
import { createServerSupabaseClient } from "../supabase/server"

export type Parent = {
  parentid: string
  firstname: string
  lastname: string
  email: string
  phone: string
}

// Client-side parent functions
export const parentClient = {
  /**
   * Get all parents
   */
  async getAll(): Promise<Parent[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("parent").select("*").order("lastname")

    if (error) {
      console.error("Error fetching parents:", error)
      return []
    }

    return data || []
  },

  /**
   * Get parent by ID
   */
  async getById(id: string): Promise<Parent | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from("parent").select("*").eq("parentid", id).single()

    if (error) {
      console.error("Error fetching parent:", error)
      return null
    }

    return data
  },

  /**
   * Get parent by email
   */
  async getByEmail(email: string): Promise<Parent | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from("parent").select("*").eq("email", email).single()

    if (error) {
      console.error("Error fetching parent by email:", error)
      return null
    }

    return data
  },
}

// Server-side parent functions
export const parentServer = {
  /**
   * Get all parents
   */
  async getAll(): Promise<Parent[]> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("parent").select("*").order("lastname")

    if (error) {
      console.error("Error fetching parents:", error)
      return []
    }

    return data || []
  },

  /**
   * Get parent by ID
   */
  async getById(id: string): Promise<Parent | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("parent").select("*").eq("parentid", id).single()

    if (error) {
      console.error("Error fetching parent:", error)
      return null
    }

    return data
  },

  /**
   * Create new parent
   */
  async create(parent: Omit<Parent, "parentid">): Promise<Parent | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("parent").insert([parent]).select().single()

    if (error) {
      console.error("Error creating parent:", error)
      return null
    }

    return data
  },

  /**
   * Update parent
   */
  async update(id: string, updates: Partial<Omit<Parent, "parentid">>): Promise<Parent | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("parent").update(updates).eq("parentid", id).select().single()

    if (error) {
      console.error("Error updating parent:", error)
      return null
    }

    return data
  },

  /**
   * Delete parent
   */
  async delete(id: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("parent").delete().eq("parentid", id)

    if (error) {
      console.error("Error deleting parent:", error)
      return false
    }

    return true
  },
}
