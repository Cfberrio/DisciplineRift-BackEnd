import { createClient } from '@supabase/supabase-js'

// Tipos para las estructuras de datos
interface SessionData {
  idx: number
  sessionid: string
  teamid: string
  startdate: string
  enddate: string
  starttime: string
  endtime: string
  daysofweek: string
  repeat: string
  coachid: string
  cancel?: string
}

interface AssistanceData {
  idx: number
  id: string
  sessionid: string
  studentid: string
  date: string
  assisted: boolean
}

interface CoachData {
  id: string
  name: string
  email: string
  phone?: string
}

interface TeamData {
  teamid: string
  name: string
  description?: string
  schoolid: number
}

interface SessionWithoutAttendance {
  session: SessionData
  coach: CoachData
  team: TeamData
}

interface ReminderEmailRecord {
  id?: string
  type: string
  recipient: string
  content: string
  date: string
}

interface StudentWithMissingAttendance {
  student: {
    studentid: string
    firstname: string
    lastname: string
    parentid: string
  }
  parent: {
    parentid: string
    firstname: string
    lastname: string
    email: string
    phone?: string
  }
  session: SessionData
  team: TeamData
}

class ReminderService {
  private supabase

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  /**
   * Calcula las sesiones que deberían ocurrir en la fecha actual
   */
  private calculateTodaysSessions(sessions: SessionData[]): SessionData[] {
    const today = new Date()
    const todayString = today.toISOString().split('T')[0] // YYYY-MM-DD
    const todayDayName = this.getDayName(today.getDay())

    return sessions.filter(session => {
      // Verificar si la sesión está en el rango de fechas
      // Agregar T00:00:00 para forzar interpretación local y evitar desfase de zona horaria
      const startDate = new Date(session.startdate + 'T00:00:00')
      const endDate = new Date(session.enddate + 'T00:00:00')
      
      if (today < startDate || today > endDate) {
        return false
      }

      // Verificar si hoy es uno de los días de la semana de la sesión
      const sessionDays = session.daysofweek.toLowerCase()
      if (!sessionDays.includes(todayDayName.toLowerCase())) {
        return false
      }

      // Verificar si la sesión fue cancelada hoy
      if (session.cancel) {
        const cancelledDates = session.cancel.split(',').map(date => date.trim())
        if (cancelledDates.includes(todayString)) {
          return false
        }
      }

      return true
    })
  }

  /**
   * Convierte el número del día a nombre del día
   */
  private getDayName(dayNumber: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayNumber]
  }

  /**
   * Verifica si existe asistencia para una sesión en la fecha actual
   */
  private async hasAttendanceForSession(sessionId: string, date: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('assistance')
      .select('id')
      .eq('sessionid', sessionId)
      .eq('date', date)
      .limit(1)

    if (error) {
      console.error('Error checking attendance:', error)
      return false
    }

    return data && data.length > 0
  }

  /**
   * Obtiene información del coach por ID
   */
  private async getCoachInfo(coachId: string): Promise<CoachData | null> {
    const { data, error } = await this.supabase
      .from('staff')
      .select('id, name, email, phone')
      .eq('id', coachId)
      .single()

    if (error) {
      console.error('Error fetching coach info:', error)
      return null
    }

    return data
  }

  /**
   * Obtiene información del equipo por ID
   */
  private async getTeamInfo(teamId: string): Promise<TeamData | null> {
    const { data, error } = await this.supabase
      .from('team')
      .select('teamid, name, description, schoolid')
      .eq('teamid', teamId)
      .single()

    if (error) {
      console.error('Error fetching team info:', error)
      return null
    }

    return data
  }

  /**
   * Obtiene todas las sesiones sin asistencia del día actual
   */
  async getSessionsWithoutAttendance(): Promise<SessionWithoutAttendance[]> {
    try {
      // Obtener todas las sesiones
      const { data: sessions, error: sessionsError } = await this.supabase
        .from('session')
        .select('*')

      if (sessionsError) {
        throw new Error(`Error fetching sessions: ${sessionsError.message}`)
      }

      if (!sessions || sessions.length === 0) {
        return []
      }

      // Calcular sesiones del día actual
      const todaysSessions = this.calculateTodaysSessions(sessions as SessionData[])
      
      if (todaysSessions.length === 0) {
        return []
      }

      const sessionsWithoutAttendance: SessionWithoutAttendance[] = []
      const today = new Date().toISOString().split('T')[0]

      // Verificar asistencia para cada sesión
      for (const session of todaysSessions) {
        const hasAttendance = await this.hasAttendanceForSession(session.sessionid, today)
        
        if (!hasAttendance) {
          // Obtener información del coach y equipo
          const [coach, team] = await Promise.all([
            this.getCoachInfo(session.coachid),
            this.getTeamInfo(session.teamid)
          ])

          if (coach && team && coach.email) {
            sessionsWithoutAttendance.push({
              session,
              coach,
              team
            })
          }
        }
      }

      return sessionsWithoutAttendance

    } catch (error) {
      console.error('Error getting sessions without attendance:', error)
      throw error
    }
  }

  /**
   * Guarda un registro de email enviado en la tabla reminder_emails
   */
  async saveReminderEmail(reminderRecord: ReminderEmailRecord): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('reminder_emails')
        .insert({
          type: reminderRecord.type,
          recipient: reminderRecord.recipient,
          content: reminderRecord.content,
          date: reminderRecord.date
        })

      if (error) {
        console.error('Error saving reminder email:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error saving reminder email:', error)
      return false
    }
  }

  /**
   * Obtiene el historial de emails de recordatorio enviados
   */
  async getReminderHistory(): Promise<ReminderEmailRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('reminder_emails')
        .select('*')
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching reminder history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching reminder history:', error)
      return []
    }
  }

  /**
   * Obtiene estudiantes con asistencia faltante para hoy
   */
  async getStudentsWithMissingAttendance(): Promise<StudentWithMissingAttendance[]> {
    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

      // Obtener todas las sesiones de hoy
      const todaysSessions = await this.getTodaysSessions()
      
      if (todaysSessions.length === 0) {
        return []
      }

      const studentsWithMissingAttendance: StudentWithMissingAttendance[] = []

      for (const session of todaysSessions) {
        // Obtener estudiantes inscritos en el equipo de esta sesión
        const { data: enrollments, error: enrollmentError } = await this.supabase
          .from('enrollment')
          .select(`
            studentid,
            student:studentid (
              studentid,
              firstname,
              lastname,
              parentid,
              parent:parentid (
                parentid,
                firstname,
                lastname,
                email,
                phone
              )
            )
          `)
          .eq('teamid', session.teamid)
          .eq('isactive', true)

        if (enrollmentError) {
          console.error('Error fetching enrollments:', enrollmentError)
          continue
        }

        if (!enrollments || enrollments.length === 0) {
          continue
        }

        // Para cada estudiante inscrito, verificar si tiene asistencia registrada
        for (const enrollment of enrollments) {
          const student = enrollment.student
          if (!student || !student.parent) continue

          // Verificar si hay asistencia registrada para este estudiante en esta sesión
          const { data: attendance, error: attendanceError } = await this.supabase
            .from('assistance')
            .select('id, assisted')
            .eq('sessionid', session.sessionid)
            .eq('studentid', student.studentid)
            .eq('date', today)
            .limit(1)

          if (attendanceError) {
            console.error('Error checking attendance:', attendanceError)
            continue
          }

          // Solo incluir estudiantes que SÍ tienen registro en assistance y están marcados como assisted: false
          const hasAttendanceRecord = attendance && attendance.length > 0
          const isAbsent = hasAttendanceRecord && attendance[0].assisted === false
          
          if (isAbsent) {
            // Obtener información del equipo
            const team = await this.getTeamInfo(session.teamid)
            if (team) {
              studentsWithMissingAttendance.push({
                student: {
                  studentid: student.studentid,
                  firstname: student.firstname,
                  lastname: student.lastname,
                  parentid: student.parentid
                },
                parent: {
                  parentid: student.parent.parentid,
                  firstname: student.parent.firstname,
                  lastname: student.parent.lastname,
                  email: student.parent.email,
                  phone: student.parent.phone
                },
                session,
                team
              })
            }
          }
        }
      }

      return studentsWithMissingAttendance

    } catch (error) {
      console.error('Error getting students with missing attendance:', error)
      throw error
    }
  }

  /**
   * Obtiene las sesiones de hoy (método auxiliar)
   */
  private async getTodaysSessions(): Promise<SessionData[]> {
    const { data: sessions, error } = await this.supabase
      .from('session')
      .select('*')

    if (error) {
      throw new Error(`Error fetching sessions: ${error.message}`)
    }

    if (!sessions || sessions.length === 0) {
      return []
    }

    return this.calculateTodaysSessions(sessions as SessionData[])
  }
}

export { ReminderService }
export type { SessionWithoutAttendance, CoachData, TeamData, ReminderEmailRecord, StudentWithMissingAttendance }
