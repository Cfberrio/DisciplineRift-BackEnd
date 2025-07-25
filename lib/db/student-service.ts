import { createClient } from "../supabase/client"
import { createServerSupabaseClient } from "../supabase/server"

export type Student = {
  studentid: string
  parentid: string
  firstname: string
  lastname: string
  dob: string
  grade: string
  ecname: string
  ecphone: string
  ecrelationship: string
}

// Client-side student functions
export const studentClient = {
  /**
   * Get all students
   */
  async getAll(): Promise<Student[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("student").select("*").order("lastname")

    if (error) {
      console.error("Error fetching students:", error)
      return []
    }

    return data || []
  },

  /**
   * Get student by ID
   */
  async getById(id: string): Promise<Student | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from("student").select("*").eq("studentid", id).single()

    if (error) {
      console.error("Error fetching student:", error)
      return null
    }

    return data
  },

  /**
   * Get students by parent ID
   */
  async getByParentId(parentId: string): Promise<Student[]> {
    const supabase = createClient()
    const { data, error } = await supabase.from("student").select("*").eq("parentid", parentId).order("lastname")

    if (error) {
      console.error("Error fetching students by parent:", error)
      return []
    }

    return data || []
  },
}

// Server-side student functions
export const studentServer = {
  /**
   * Get all students
   */
  async getAll(): Promise<Student[]> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("student").select("*").order("lastname")

    if (error) {
      console.error("Error fetching students:", error)
      return []
    }

    return data || []
  },

  /**
   * Get student by ID
   */
  async getById(id: string): Promise<Student | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("student").select("*").eq("studentid", id).single()

    if (error) {
      console.error("Error fetching student:", error)
      return null
    }

    return data
  },

  /**
   * Create new student
   */
  async create(student: Omit<Student, "studentid">): Promise<Student | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("student").insert([student]).select().single()

    if (error) {
      console.error("Error creating student:", error)
      return null
    }

    return data
  },

  /**
   * Update student
   */
  async update(id: string, updates: Partial<Omit<Student, "studentid">>): Promise<Student | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("student").update(updates).eq("studentid", id).select().single()

    if (error) {
      console.error("Error updating student:", error)
      return null
    }

    return data
  },

  /**
   * Delete student
   */
  async delete(id: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("student").delete().eq("studentid", id)

    if (error) {
      console.error("Error deleting student:", error)
      return false
    }

    return true
  },
}
