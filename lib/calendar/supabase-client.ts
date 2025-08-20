import { supabase } from '@/lib/supabase/client'
import type { Session } from '@/lib/db/session-service'

export interface SessionRow {
  sessionid: string
  teamid: string
  startdate: string
  enddate?: string | null
  starttime: string
  endtime: string
  daysofweek?: string | null
  repeat?: string | null
  coachid?: string | null
}

export interface UpdateSessionInput {
  sessionid: string
  startdate?: string
  enddate?: string | null
  starttime?: string
  endtime?: string
  daysofweek?: string
  coachid?: string | null
  repeat?: string
}

export interface ParentInfo {
  parentid: string
  email?: string
  phone?: string
  firstname?: string
  lastname?: string
}

/**
 * Obtiene todas las sesiones en un rango de fechas opcional
 */
export async function fetchSessions(
  rangeStart?: string, 
  rangeEnd?: string
): Promise<SessionRow[]> {
  try {
    let query = supabase
      .from('session')
      .select('sessionid, teamid, startdate, enddate, starttime, endtime, daysofweek, repeat, coachid')
      .order('startdate')

    // Filtrar por rango de fechas si se proporciona
    if (rangeStart) {
      query = query.gte('startdate', rangeStart)
    }
    if (rangeEnd) {
      query = query.lte('startdate', rangeEnd)
    }

    const { data, error } = await query.limit(1000)

    if (error) {
      console.error('Error fetching sessions:', error)
      throw new Error(`Error fetching sessions: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in fetchSessions:', error)
    throw error
  }
}

/**
 * Actualiza una sesión
 */
export async function updateSession(input: UpdateSessionInput): Promise<void> {
  try {
    console.log('updateSession called with:', input)
    const { sessionid, ...updateData } = input
    
    // Filtrar campos undefined y null
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    )

    console.log('Clean update data:', cleanUpdateData)

    // Verificar que el sessionid existe
    const { data: existingSession, error: checkError } = await supabase
      .from('session')
      .select('sessionid')
      .eq('sessionid', sessionid)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing session:', checkError)
      throw new Error(`Error checking session: ${checkError.message}`)
    }

    if (!existingSession) {
      throw new Error(`Session with ID ${sessionid} not found`)
    }

    // Realizar la actualización
    const { data, error } = await supabase
      .from('session')
      .update(cleanUpdateData)
      .eq('sessionid', sessionid)
      .select()

    if (error) {
      console.error('Error updating session:', error)
      throw new Error(`Error updating session: ${error.message}`)
    }

    console.log('Session updated successfully:', data)
  } catch (error) {
    console.error('Error in updateSession:', error)
    throw error
  }
}

/**
 * Obtiene el nombre del equipo por teamid
 */
export async function getTeamName(teamid: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('team')
      .select('name')
      .eq('teamid', teamid)
      .maybeSingle()

    if (error) {
      console.warn('Error fetching team name:', error)
      return `Team ${teamid}`
    }

    return data?.name || `Team ${teamid}`
  } catch (error) {
    console.warn('Error in getTeamName:', error)
    return `Team ${teamid}`
  }
}

/**
 * Obtiene múltiples nombres de equipos en una sola query (optimización)
 */
export async function getTeamNames(teamids: string[]): Promise<Record<string, string>> {
  if (teamids.length === 0) return {}
  
  try {
    const { data, error } = await supabase
      .from('team')
      .select('teamid, name')
      .in('teamid', teamids)

    if (error) {
      console.warn('Error fetching team names:', error)
      // Fallback: crear un objeto con nombres por defecto
      return teamids.reduce((acc, id) => {
        acc[id] = `Team ${id}`
        return acc
      }, {} as Record<string, string>)
    }

    // Crear mapa de teamid -> name
    const teamMap: Record<string, string> = {}
    
    // Agregar equipos encontrados
    data?.forEach(team => {
      teamMap[team.teamid] = team.name || `Team ${team.teamid}`
    })
    
    // Agregar equipos no encontrados con nombre por defecto
    teamids.forEach(id => {
      if (!teamMap[id]) {
        teamMap[id] = `Team ${id}`
      }
    })
    
    return teamMap
  } catch (error) {
    console.warn('Error in getTeamNames:', error)
    // Fallback: crear un objeto con nombres por defecto
    return teamids.reduce((acc, id) => {
      acc[id] = `Team ${id}`
      return acc
    }, {} as Record<string, string>)
  }
}

/**
 * Obtiene información de los padres de un equipo (sin duplicados)
 */
export async function getParentsByTeam(teamid: string): Promise<ParentInfo[]> {
  try {
    // 1. Obtener estudiantes activos del equipo
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollment')
      .select('studentid')
      .eq('teamid', teamid)
      .eq('isactive', true)

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError)
      return []
    }

    const studentIds = [...new Set((enrollments || []).map(e => e.studentid))]
    if (studentIds.length === 0) return []

    // 2. Obtener parentids de los estudiantes
    const { data: students, error: studentError } = await supabase
      .from('student')
      .select('parentid')
      .in('studentid', studentIds)

    if (studentError) {
      console.error('Error fetching students:', studentError)
      return []
    }

    const parentIds = [...new Set((students || []).map(s => s.parentid))]
    if (parentIds.length === 0) return []

    // 3. Obtener información de los padres
    const { data: parents, error: parentError } = await supabase
      .from('parent')
      .select('parentid, firstname, lastname, email, phone')
      .in('parentid', parentIds)

    if (parentError) {
      console.error('Error fetching parents:', parentError)
      return []
    }

    // 4. Deduplicar por parentid
    const seen = new Set<string>()
    const uniqueParents: ParentInfo[] = []

    for (const parent of (parents || [])) {
      if (parent && !seen.has(parent.parentid)) {
        seen.add(parent.parentid)
        uniqueParents.push(parent)
      }
    }

    return uniqueParents
  } catch (error) {
    console.error('Error in getParentsByTeam:', error)
    return []
  }
}

/**
 * Obtiene información del coach por coachid
 */
export async function getCoachInfo(coachid: string | null): Promise<{ name: string; email?: string } | null> {
  if (!coachid) return null

  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, email')
      .eq('id', coachid)
      .maybeSingle()

    if (error || !data) {
      console.warn('Error fetching coach info:', error)
      return { name: `Coach ${coachid}` }
    }

    return {
      name: data.name || `Coach ${coachid}`,
      email: data.email || undefined
    }
  } catch (error) {
    console.warn('Error in getCoachInfo:', error)
    return { name: `Coach ${coachid}` }
  }
}

/**
 * Obtiene una lista de coaches disponibles
 */
export async function getAvailableCoaches(): Promise<Array<{ id: string; name: string; email?: string }>> {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, email')
      .order('name')

    if (error) {
      console.error('Error fetching coaches:', error)
      return []
    }

    return (data || []).map(coach => ({
      id: coach.id,
      name: coach.name || `Staff ${coach.id}`,
      email: coach.email || undefined
    }))
  } catch (error) {
    console.error('Error in getAvailableCoaches:', error)
    return []
  }
}

/**
 * Obtiene una sesión por ID
 */
export async function getSessionById(sessionid: string): Promise<SessionRow | null> {
  try {
    const { data, error } = await supabase
      .from('session')
      .select('sessionid, teamid, startdate, enddate, starttime, endtime, daysofweek, repeat, coachid')
      .eq('sessionid', sessionid)
      .maybeSingle()

    if (error) {
      console.error('Error fetching session by ID:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getSessionById:', error)
    return null
  }
}

/**
 * Carga todos los datos del calendario de forma optimizada
 */
export async function fetchCalendarData(): Promise<{
  sessions: SessionRow[]
  teamNames: Record<string, string>
  coaches: Array<{ id: string; name: string; email?: string }>
}> {
  try {
    // Cargar sesiones y coaches en paralelo
    const [sessionsResult, coachesResult] = await Promise.all([
      supabase
        .from('session')
        .select('sessionid, teamid, startdate, enddate, starttime, endtime, daysofweek, repeat, coachid')
        .order('startdate')
        .limit(1000),
      supabase
        .from('staff')
        .select('id, name, email')
        .order('name')
    ])

    if (sessionsResult.error) {
      console.error('Error fetching sessions:', sessionsResult.error)
      throw new Error(`Error fetching sessions: ${sessionsResult.error.message}`)
    }

    if (coachesResult.error) {
      console.warn('Error fetching coaches:', coachesResult.error)
    }

    const sessions = sessionsResult.data || []
    const coaches = (coachesResult.data || []).map(coach => ({
      id: coach.id,
      name: coach.name || `Staff ${coach.id}`,
      email: coach.email || undefined
    }))

    // Obtener IDs únicos de equipos
    const uniqueTeamIds = [...new Set(sessions.map(s => s.teamid))]
    
    // Cargar nombres de equipos en una sola query
    const teamNames = await getTeamNames(uniqueTeamIds)

    return {
      sessions,
      teamNames,
      coaches
    }
  } catch (error) {
    console.error('Error in fetchCalendarData:', error)
    throw error
  }
}
