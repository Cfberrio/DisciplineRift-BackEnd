import { createClient } from "../supabase/client"
import { createServerSupabaseClient } from "../supabase/server"

export type Admin = {
  id: string
  email: string
}

// Client-side admin functions
export const adminClient = {
  /**
   * Get admin by ID
   */
  async getById(id: string): Promise<Admin | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from("admin").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching admin:", error)
      return null
    }

    return data
  },

  /**
   * Get admin by email
   */
  async getByEmail(email: string): Promise<Admin | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from("admin").select("*").eq("email", email).single()

    if (error) {
      console.error("Error fetching admin by email:", error)
      return null
    }

    return data
  },
}

// Server-side admin functions
export const adminServer = {
  /**
   * Get admin by ID
   */
  async getById(id: string): Promise<Admin | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("admin").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching admin:", error)
      return null
    }

    return data
  },

  /**
   * Get admin by email
   */
  async getByEmail(email: string): Promise<Admin | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("admin").select("*").eq("email", email).single()

    if (error) {
      console.error("Error fetching admin by email:", error)
      return null
    }

    return data
  },

  /**
   * Create new admin
   */
  async create(admin: Omit<Admin, "id">): Promise<Admin | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("admin").insert([admin]).select().single()

    if (error) {
      console.error("Error creating admin:", error)
      return null
    }

    return data
  },

  /**
   * Update admin
   */
  async update(id: string, updates: Partial<Admin>): Promise<Admin | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("admin").update(updates).eq("id", id).select().single()

    if (error) {
      console.error("Error updating admin:", error)
      return null
    }

    return data
  },

  /**
   * Delete admin
   */
  async delete(id: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("admin").delete().eq("id", id)

    if (error) {
      console.error("Error deleting admin:", error)
      return false
    }

    return true
  },
}
