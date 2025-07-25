import { supabase } from "@/lib/supabase/client"
import type { School } from "@/lib/db/school-service"

export type { School } from "@/lib/db/school-service"

export const schoolsApi = {
  async getAll(): Promise<School[]> {
    console.log("[SCHOOLS_API] Getting all schools...")
    
    try {
    const { data, error } = await supabase.from("school").select("*").order("schoolid", { ascending: true })

    if (error) {
        console.error("[SCHOOLS_API] Supabase error fetching schools:", error)
        throw new Error(`Error al obtener las escuelas: ${error.message}`)
    }

      console.log("[SCHOOLS_API] Schools fetched:", data?.length || 0, "records")
      return (data || []) as School[]
    } catch (error) {
      console.error("[SCHOOLS_API] Error in getAll:", error)
      throw error
    }
  },

  async getById(id: string): Promise<School> {
    console.log("[SCHOOLS_API] Getting school by ID:", id)
    
    try {
      const { data, error } = await supabase.from("school").select("*").eq("schoolid", Number(id)).single()

    if (error) {
        console.error("[SCHOOLS_API] Supabase error fetching school by id:", error)
        throw new Error(`Error al obtener la escuela: ${error.message}`)
    }

    if (!data) {
      throw new Error("Escuela no encontrada")
    }

    console.log("[SCHOOLS_API] School found:", data)
      return data as School
    } catch (error) {
      console.error("[SCHOOLS_API] Error in getById:", error)
      throw error
    }
  },

  async create(school: Omit<School, "schoolid">): Promise<School> {
    console.log("[SCHOOLS_API] Creating school:", school)
    
    try {
    const { data, error } = await supabase.from("school").insert([school]).select().single()

    if (error) {
        console.error("[SCHOOLS_API] Supabase error creating school:", error)
        throw new Error(`Error al crear la escuela: ${error.message}`)
    }

    if (!data) {
        throw new Error("Error al crear la escuela - no data returned")
    }

    console.log("[SCHOOLS_API] School created:", data)
      return data as School
    } catch (error) {
      console.error("[SCHOOLS_API] Error in create:", error)
      throw error
    }
  },

  async update(id: string, school: Partial<Omit<School, "schoolid">>): Promise<School> {
    console.log("[SCHOOLS_API] Updating school:", id, school)
    
    try {
      const { data, error } = await supabase.from("school").update(school).eq("schoolid", Number(id)).select().single()

    if (error) {
        console.error("[SCHOOLS_API] Supabase error updating school:", error)
        throw new Error(`Error al actualizar la escuela: ${error.message}`)
    }

    if (!data) {
        throw new Error("Error al actualizar la escuela - no data returned")
    }

    console.log("[SCHOOLS_API] School updated:", data)
      return data as School
    } catch (error) {
      console.error("[SCHOOLS_API] Error in update:", error)
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    console.log("[SCHOOLS_API] Deleting school:", id)
    
    try {
      const { error } = await supabase.from("school").delete().eq("schoolid", Number(id))

    if (error) {
        console.error("[SCHOOLS_API] Supabase error deleting school:", error)
        throw new Error(`Error al eliminar la escuela: ${error.message}`)
    }

    console.log("[SCHOOLS_API] School deleted:", id)
    } catch (error) {
      console.error("[SCHOOLS_API] Error in delete:", error)
      throw error
    }
  },
}
