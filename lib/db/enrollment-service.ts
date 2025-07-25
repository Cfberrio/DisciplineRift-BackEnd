import { createClient } from "../supabase/client"
import { createServerSupabaseClient } from "../supabase/server"

export type Enrollment = {
  enrollmentid: string
  studentid: string
  teamid: string
  isactive: boolean
}

// Client-side enrollment functions
export const enrollmentClient = {
  /**
   * Get all enrollments
   */
  async getAll(options?: { teamId?: string; studentId?: string; isActive?: boolean }): Promise<Enrollment[]> {
    const supabase = createClient()
    let query = supabase.from("enrollment").select("*")

    if (options?.teamId) {
      query = query.eq("teamid", options.teamId)
    }

    if (options?.studentId) {
      query = query.eq("studentid", options.studentId)
    }

    if (options?.isActive !== undefined) {
      query = query.eq("isactive", options.isActive)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching enrollments:", error)
      return []
    }

    return data || []
  },

  /**
   * Get enrollment by ID
   */
  async getById(id: string): Promise<Enrollment | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from("enrollment").select("*").eq("enrollmentid", id).single()

    if (error) {
      console.error("Error fetching enrollment:", error)
      return null
    }

    return data
  },

  /**
   * Get enrollments by team ID
   */
  async getByTeamId(teamId: string): Promise<Enrollment[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("enrollment").select("*").eq("teamid", teamId)

    if (error) {
      console.error("Error fetching enrollments by team:", error)
      return []
    }

    return data || []
  },

  /**
   * Get enrollments by student ID
   */
  async getByStudentId(studentId: string): Promise<Enrollment[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("enrollment").select("*").eq("studentid", studentId)

    if (error) {
      console.error("Error fetching enrollments by student:", error)
      return []
    }

    return data || []
  },
}

// Server-side enrollment functions
export const enrollmentServer = {
  /**
   * Get all enrollments
   */
  async getAll(options?: { teamId?: string; studentId?: string; isActive?: boolean }): Promise<Enrollment[]> {
    const supabase = await createServerSupabaseClient()
    let query = supabase.from("enrollment").select("*")

    if (options?.teamId) {
      query = query.eq("teamid", options.teamId)
    }

    if (options?.studentId) {
      query = query.eq("studentid", options.studentId)
    }

    if (options?.isActive !== undefined) {
      query = query.eq("isactive", options.isActive)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching enrollments:", error)
      return []
    }

    return data || []
  },

  /**
   * Get enrollment by ID
   */
  async getById(id: string): Promise<Enrollment | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("enrollment").select("*").eq("enrollmentid", id).single()

    if (error) {
      console.error("Error fetching enrollment:", error)
      return null
    }

    return data
  },

  /**
   * Create new enrollment
   */
  async create(enrollment: Omit<Enrollment, "enrollmentid">): Promise<Enrollment | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("enrollment").insert([enrollment]).select().single()

    if (error) {
      console.error("Error creating enrollment:", error)
      return null
    }

    return data
  },

  /**
   * Update enrollment
   */
  async update(id: string, updates: Partial<Omit<Enrollment, "enrollmentid">>): Promise<Enrollment | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("enrollment").update(updates).eq("enrollmentid", id).select().single()

    if (error) {
      console.error("Error updating enrollment:", error)
      return null
    }

    return data
  },

  /**
   * Delete enrollment
   */
  async delete(id: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("enrollment").delete().eq("enrollmentid", id)

    if (error) {
      console.error("Error deleting enrollment:", error)
      return false
    }

    return true
  },
}
