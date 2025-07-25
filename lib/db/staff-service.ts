import { createClient } from "@/lib/supabase/server"

export interface Staff {
  id: string
  name: string
  email: string | null
  phone: string | null
}

export class StaffService {
  private supabase = createClient()

  async getAll(): Promise<Staff[]> {
    try {
      const { data, error } = await this.supabase
        .from("staff")
        .select("id, name, email, phone")
        .order("name", { ascending: true })

      if (error) {
        console.error("Error fetching staff:", error)
        throw new Error(`Database error: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error("StaffService.getAll error:", error)
      throw error
    }
  }

  async getById(id: string): Promise<Staff | null> {
    try {
      const { data, error } = await this.supabase.from("staff").select("id, name, email, phone").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null // Not found
        }
        console.error("Error fetching staff by id:", error)
        throw new Error(`Database error: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("StaffService.getById error:", error)
      throw error
    }
  }

  async create(staffData: Omit<Staff, "id">): Promise<Staff> {
    try {
      const { data, error } = await this.supabase
        .from("staff")
        .insert([
          {
            name: staffData.name,
            email: staffData.email || null,
            phone: staffData.phone || null,
          },
        ])
        .select("id, name, email, phone")
        .single()

      if (error) {
        console.error("Error creating staff:", error)
        throw new Error(`Database error: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("StaffService.create error:", error)
      throw error
    }
  }

  async update(id: string, staffData: Partial<Omit<Staff, "id">>): Promise<Staff> {
    try {
      const { data, error } = await this.supabase
        .from("staff")
        .update({
          ...(staffData.name && { name: staffData.name }),
          ...(staffData.email !== undefined && { email: staffData.email || null }),
          ...(staffData.phone !== undefined && { phone: staffData.phone || null }),
        })
        .eq("id", id)
        .select("id, name, email, phone")
        .single()

      if (error) {
        console.error("Error updating staff:", error)
        throw new Error(`Database error: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error("StaffService.update error:", error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase.from("staff").delete().eq("id", id)

      if (error) {
        console.error("Error deleting staff:", error)
        throw new Error(`Database error: ${error.message}`)
      }
    } catch (error) {
      console.error("StaffService.delete error:", error)
      throw error
    }
  }
}
