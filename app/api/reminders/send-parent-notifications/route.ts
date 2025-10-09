import { NextRequest, NextResponse } from 'next/server'
import { ReminderEmailService } from '@/lib/services/reminder-email-service'

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Starting parent absence notification process...')

    const reminderService = new ReminderEmailService()
    
    // Enviar notificaciones a padres
    const result = await reminderService.sendParentAbsenceNotifications()

    console.log('[API] Parent notification process completed:', {
      success: result.success,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.length
    })

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Parent notifications sent successfully. ${result.sent} emails sent.`
        : `Process completed with errors. ${result.sent} sent, ${result.failed} failed.`,
      data: {
        sent: result.sent,
        failed: result.failed,
        errors: result.errors,
        details: result.details
      }
    }, { 
      status: result.success ? 200 : 207 // 207 Multi-Status for partial success
    })

  } catch (error) {
    console.error('[API] Error in parent notification sending:', error)
    
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
    
    // Obtener estudiantes con asistencia faltante para preview
    const studentsWithMissingAttendance = await reminderService.getStudentsWithMissingAttendance()
    
    // Obtener historial
    const history = await reminderService.getReminderHistory()

    return NextResponse.json({
      success: true,
      data: {
        studentsWithMissingAttendance,
        history
      }
    })

  } catch (error) {
    console.error('[API] Error fetching parent notification data:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
