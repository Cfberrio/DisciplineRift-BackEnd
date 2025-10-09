import { ReminderService, SessionWithoutAttendance, ReminderEmailRecord, StudentWithMissingAttendance } from '@/lib/db/reminder-service'
import { sendEmail } from '@/lib/email-service'
import { generateCoachReminderTemplate, generateCoachReminderSubject } from '@/lib/email-templates/coach-reminder-template'
import { generateParentAbsenceTemplate, generateParentAbsenceSubject } from '@/lib/email-templates/parent-absence-template'

interface EmailResult {
  success: boolean
  sent: number
  failed: number
  errors: string[]
  details: Array<{
    coach: string
    team: string
    email: string
    success: boolean
    error?: string
  }>
}

interface ReminderHistory {
  id: string
  type: string
  recipient: string
  content: string
  date: string
}

class ReminderEmailService {
  private reminderService: ReminderService

  constructor() {
    this.reminderService = new ReminderService()
  }

  /**
   * Envía emails de recordatorio a coaches que no han completado la asistencia
   */
  async sendCoachReminders(): Promise<EmailResult> {
    const result: EmailResult = {
      success: false,
      sent: 0,
      failed: 0,
      errors: [],
      details: []
    }

    try {
      // Obtener sesiones sin asistencia
      const sessionsWithoutAttendance = await this.reminderService.getSessionsWithoutAttendance()

      if (sessionsWithoutAttendance.length === 0) {
        result.success = true
        result.errors.push('No hay sesiones pendientes de asistencia para hoy')
        return result
      }

      // Procesar cada sesión
      for (const sessionData of sessionsWithoutAttendance) {
        const { session, coach, team } = sessionData

        try {
          // Format date and time - use current date instead of session start date
          const currentDate = new Date()
          const sessionDate = currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

          const sessionTime = new Date(`2000-01-01T${session.starttime}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })

          const sessionEndTime = new Date(`2000-01-01T${session.endtime}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })

          // Generar contenido del email
          const emailContent = generateCoachReminderTemplate({
            coachName: coach.name,
            teamName: team.name,
            sessionDate,
            sessionTime,
            sessionEndTime
          })

          const subject = generateCoachReminderSubject(team.name)

          // Enviar email
          const emailResult = await sendEmail({
            from: process.env.GMAIL_USER,
            to: coach.email,
            subject,
            html: emailContent.html
          })

          if (emailResult.success) {
            result.sent++
            result.details.push({
              coach: coach.name,
              team: team.name,
              email: coach.email,
              success: true
            })

            // Save to history
            await this.reminderService.saveReminderEmail({
              type: 'coach reminder',
              recipient: coach.email,
              content: `Reminder sent to ${coach.name} to complete attendance for team ${team.name} on ${sessionDate}`,
              date: new Date().toLocaleDateString('en-CA') + 'T' + new Date().toLocaleTimeString('en-GB')
            })

          } else {
            result.failed++
            result.errors.push(`Error sending email to ${coach.name}: ${emailResult.error}`)
            result.details.push({
              coach: coach.name,
              team: team.name,
              email: coach.email,
              success: false,
              error: emailResult.error
            })

            console.error(`[REMINDER] Failed to send email to ${coach.name}:`, emailResult.error)
          }

        } catch (error) {
          result.failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push(`Error processing session for ${coach.name}: ${errorMessage}`)
          result.details.push({
            coach: coach.name,
            team: team.name,
            email: coach.email,
            success: false,
            error: errorMessage
          })

          console.error(`[REMINDER] Error processing session for ${coach.name}:`, error)
        }
      }

      // Determinar éxito general
      result.success = result.sent > 0 && result.failed === 0

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`General error in reminder process: ${errorMessage}`)
      console.error('[REMINDER] General error in reminder process:', error)
      return result
    }
  }

  /**
   * Obtiene el historial de emails de recordatorio enviados
   */
  async getReminderHistory(): Promise<ReminderHistory[]> {
    try {
      const history = await this.reminderService.getReminderHistory()
      return history.map(record => ({
        id: record.id || '',
        type: record.type,
        recipient: record.recipient,
        content: record.content,
        date: record.date
      }))
    } catch (error) {
      console.error('[REMINDER] Error fetching reminder history:', error)
      return []
    }
  }

  /**
   * Envía emails de notificación a padres de estudiantes con asistencia faltante
   */
  async sendParentAbsenceNotifications(): Promise<EmailResult> {
    const result: EmailResult = {
      success: false,
      sent: 0,
      failed: 0,
      errors: [],
      details: []
    }

    try {
      // Obtener estudiantes con asistencia faltante
      const studentsWithMissingAttendance = await this.reminderService.getStudentsWithMissingAttendance()

      if (studentsWithMissingAttendance.length === 0) {
        result.success = true
        result.errors.push('No students with missing attendance found for today')
        return result
      }

      // Procesar cada estudiante
      for (const studentData of studentsWithMissingAttendance) {
        const { student, parent, session, team } = studentData

        try {
          // Formatear fecha y hora
          const currentDate = new Date()
          const sessionDate = currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

          const sessionTime = new Date(`2000-01-01T${session.starttime}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })

          const sessionEndTime = new Date(`2000-01-01T${session.endtime}`).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          })

          // Generar contenido del email
          const emailContent = generateParentAbsenceTemplate({
            parentName: `${parent.firstname} ${parent.lastname}`,
            studentName: `${student.firstname} ${student.lastname}`,
            teamName: team.name,
            sessionDate,
            sessionTime,
            sessionEndTime
          })

          const subject = generateParentAbsenceSubject(`${student.firstname} ${student.lastname}`, team.name)

          // Enviar email
          const emailResult = await sendEmail({
            from: process.env.GMAIL_USER,
            to: parent.email,
            subject,
            html: emailContent.html
          })

          if (emailResult.success) {
            result.sent++
            result.details.push({
              coach: `${parent.firstname} ${parent.lastname}`,
              team: `${student.firstname} ${student.lastname} (${team.name})`,
              email: parent.email,
              success: true
            })

            // Save to history
            await this.reminderService.saveReminderEmail({
              type: 'parent absence notification',
              recipient: parent.email,
              content: `Absence notification sent to ${parent.firstname} ${parent.lastname} for ${student.firstname} ${student.lastname} in team ${team.name} on ${sessionDate}`,
              date: new Date().toLocaleDateString('en-CA') + 'T' + new Date().toLocaleTimeString('en-GB')
            })

          } else {
            result.failed++
            result.errors.push(`Error sending absence notification to ${parent.firstname} ${parent.lastname}: ${emailResult.error}`)
            result.details.push({
              coach: `${parent.firstname} ${parent.lastname}`,
              team: `${student.firstname} ${student.lastname} (${team.name})`,
              email: parent.email,
              success: false,
              error: emailResult.error
            })

            console.error(`[REMINDER] Failed to send absence notification to ${parent.firstname} ${parent.lastname}:`, emailResult.error)
          }

        } catch (error) {
          result.failed++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          result.errors.push(`Error processing absence notification for ${student.firstname} ${student.lastname}: ${errorMessage}`)
          result.details.push({
            coach: `${parent.firstname} ${parent.lastname}`,
            team: `${student.firstname} ${student.lastname} (${team.name})`,
            email: parent.email,
            success: false,
            error: errorMessage
          })

          console.error(`[REMINDER] Error processing absence notification for ${student.firstname} ${student.lastname}:`, error)
        }
      }

      // Determinar éxito general
      result.success = result.sent > 0 && result.failed === 0

      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`General error in parent notification process: ${errorMessage}`)
      console.error('[REMINDER] General error in parent notification process:', error)
      return result
    }
  }

  /**
   * Obtiene las sesiones pendientes de asistencia (para preview)
   */
  async getPendingSessions(): Promise<SessionWithoutAttendance[]> {
    try {
      return await this.reminderService.getSessionsWithoutAttendance()
    } catch (error) {
      console.error('[REMINDER] Error fetching pending sessions:', error)
      return []
    }
  }

  /**
   * Obtiene estudiantes con asistencia faltante (para preview)
   */
  async getStudentsWithMissingAttendance(): Promise<StudentWithMissingAttendance[]> {
    try {
      return await this.reminderService.getStudentsWithMissingAttendance()
    } catch (error) {
      console.error('[REMINDER] Error fetching students with missing attendance:', error)
      return []
    }
  }
}

export { ReminderEmailService }
export type { EmailResult, ReminderHistory }
