import { createServerSupabaseClient } from "@/lib/supabase/server"

export interface DrteamApplication {
  id: number
  firstName: string
  lastName: string
  number: string
  currentAddre: string
  sport: string
  description: string
  resume: string | null
  email: string
  created_at?: string
  updated_at?: string
}

export interface DrteamFilters {
  search?: string
  sport?: string
  page?: number
  pageSize?: number
}

export interface DrteamResponse {
  data: DrteamApplication[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

class DrteamService {
  async getAllApplications(filters: DrteamFilters = {}): Promise<DrteamResponse> {
    try {
      const {
        search = "",
        sport = "",
        page = 1,
        pageSize = 20
      } = filters

      const serverClient = await createServerSupabaseClient()
      
      let query = serverClient
        .from("Drteam")
        .select("*", { count: "exact" })

      // Aplicar filtros de búsqueda
      if (search.trim()) {
        query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,number.ilike.%${search}%`)
      }

      // Aplicar filtro por deporte
      if (sport.trim()) {
        query = query.eq("sport", sport)
      }

      // Aplicar ordenamiento (más recientes primero)
      query = query.order("id", { ascending: false })

      // Aplicar paginación
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        console.error("[SERVER] Error fetching Drteam applications:", error)
        throw new Error(`Error fetching applications: ${error.message}`)
      }

      const total = count || 0
      const totalPages = Math.ceil(total / pageSize)

      return {
        data: data || [],
        total,
        page,
        pageSize,
        totalPages
      }
    } catch (error) {
      console.error("[SERVER] Error in DrteamService.getAllApplications:", error)
      throw error
    }
  }

  async getSports(): Promise<string[]> {
    try {
      const serverClient = await createServerSupabaseClient()
      
      const { data, error } = await serverClient
        .from("Drteam")
        .select("sport")
        .not("sport", "is", null)
        .not("sport", "eq", "")

      if (error) {
        console.error("[SERVER] Error fetching sports:", error)
        throw new Error(`Error fetching sports: ${error.message}`)
      }

      // Extraer deportes únicos
      const uniqueSports = [...new Set(data?.map(item => item.sport).filter(Boolean))]
      return uniqueSports.sort()
    } catch (error) {
      console.error("[SERVER] Error in DrteamService.getSports:", error)
      throw error
    }
  }

  getResumeUrl(resumePath: string | null): string | null {
    if (!resumePath) return null
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      console.error("NEXT_PUBLIC_SUPABASE_URL not found")
      return null
    }

    // Construir URL pública del bucket resume
    return `${supabaseUrl}/storage/v1/object/public/resume/${resumePath}`
  }
}

export const drteamService = new DrteamService()
