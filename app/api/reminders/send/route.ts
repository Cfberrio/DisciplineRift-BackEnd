import { NextRequest, NextResponse } from 'next/server'
import { ReminderEmailService } from '@/lib/services/reminder-email-service'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting reminder sending process...')

    const reminderService = new ReminderEmailService()
    
    // Enviar recordatorios a coaches
    const result = await reminderService.sendCoachReminders()

    console.log('[API] Reminder process completed:', {
      success: result.success,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.length
    })

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Reminders sent successfully. ${result.sent} emails sent.`
        : `Process completed with errors. ${result.sent} sent, ${result.failed} failed.`,
      data: {
        sent: result.sent,
        failed: result.failed,
        errors: result.errors,
        details: result.details
      }
    }, { 
      status: result.success ? 200 : 207 // 207 Multi-Status para éxito parcial
    })

  } catch (error) {
    console.error('[API] Error in reminder sending:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const reminderService = new ReminderEmailService()
    
    // Obtener sesiones pendientes para preview
    const pendingSessions = await reminderService.getPendingSessions()
    
    // Obtener estudiantes con asistencia faltante
    const studentsWithMissingAttendance = await reminderService.getStudentsWithMissingAttendance()
    
    // Obtener historial
    const history = await reminderService.getReminderHistory()

    return NextResponse.json({
      success: true,
      data: {
        pendingSessions,
        studentsWithMissingAttendance,
        history
      }
    })

  } catch (error) {
    console.error('[API] Error fetching reminder data:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
