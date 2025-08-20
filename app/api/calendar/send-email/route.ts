import { NextRequest, NextResponse } from 'next/server'
import { DateTime } from 'luxon'
import { 
  getSessionById,
  getTeamName,
  getParentsByTeam,
  getCoachInfo
} from '@/lib/calendar/supabase-client'
import { sendMail, generatePracticeEmailTemplate, isEmailConfigured } from '@/lib/mailer'
import { expandOccurrences } from '@/utils/schedule'

export async function POST(request: NextRequest) {
  try {
    // Verificar configuración de email
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { 
          error: 'Email not configured', 
          details: 'SMTP configuration is missing. Please check environment variables.' 
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { teamid, sessionid, occurrence } = body

    // Validar parámetros requeridos
    if (!teamid || !sessionid) {
      return NextResponse.json(
        { error: 'Missing required parameters', details: 'teamid and sessionid are required' },
        { status: 400 }
      )
    }

    // Obtener información de la sesión
    const session = await getSessionById(sessionid)
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found', details: `Session with id ${sessionid} not found` },
        { status: 404 }
      )
    }

    // Obtener información del equipo
    const teamName = await getTeamName(teamid)

    // Obtener información del coach
    const coachInfo = session.coachid ? await getCoachInfo(session.coachid) : null

    // Obtener padres del equipo
    const parents = await getParentsByTeam(teamid)
    
    // Filtrar padres con email válido
    const parentsWithEmail = parents.filter(parent => parent.email && parent.email.includes('@'))
    
    if (parentsWithEmail.length === 0) {
      return NextResponse.json(
        { 
          error: 'No recipients found', 
          details: 'No parents with valid email addresses found for this team',
          sent: 0,
          skipped: parents.length
        },
        { status: 400 }
      )
    }

    // Determinar la fecha de la práctica
    let practiceDate: DateTime
    let practiceTime: string

    if (occurrence) {
      // Si se especifica una ocurrencia particular (formato YYYYMMDD)
      const year = parseInt(occurrence.substring(0, 4))
      const month = parseInt(occurrence.substring(4, 6))
      const day = parseInt(occurrence.substring(6, 8))
      
      practiceDate = DateTime.fromObject(
        { year, month, day },
        { zone: 'America/New_York' }
      )
    } else {
      // Usar la próxima ocurrencia de la serie
      const occurrences = expandOccurrences(session)
      const futureOccurrences = occurrences.filter(occ => 
        DateTime.fromJSDate(occ.start, { zone: 'America/New_York' }) > DateTime.now()
      )
      
      if (futureOccurrences.length === 0) {
        return NextResponse.json(
          { 
            error: 'No future practices found', 
            details: 'No upcoming practices found for this session',
            sent: 0,
            skipped: parentsWithEmail.length
          },
          { status: 400 }
        )
      }
      
      practiceDate = DateTime.fromJSDate(futureOccurrences[0].start, { zone: 'America/New_York' })
    }

    // Formatear la hora de la práctica
    const [startHour, startMinute] = session.starttime.split(':').map(n => parseInt(n, 10))
    const [endHour, endMinute] = session.endtime.split(':').map(n => parseInt(n, 10))
    
    const startTime = practiceDate.set({ hour: startHour, minute: startMinute })
    const endTime = practiceDate.set({ hour: endHour, minute: endMinute })
    
    practiceTime = `${startTime.toFormat('h:mm a')} - ${endTime.toFormat('h:mm a')}`

    // Generar contenido del email
    const { html, text } = generatePracticeEmailTemplate({
      teamName,
      practiceDate: practiceDate.toFormat('cccc, d \'de\' LLLL \'del\' yyyy'),
      practiceTime,
      coachName: coachInfo?.name,
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/calendario` : undefined
    })

    // Preparar lista de emails
    const emailAddresses = parentsWithEmail.map(parent => parent.email!).filter(Boolean)

    // Enviar emails
    const result = await sendMail({
      to: emailAddresses,
      subject: `Recordatorio de Práctica - ${teamName}`,
      html,
      text
    })

    // Preparar respuesta
    const response = {
      sent: result.sent,
      skipped: result.skipped + (parents.length - parentsWithEmail.length),
      errors: result.errors,
      details: {
        teamName,
        practiceDate: practiceDate.toFormat('yyyy-LL-dd'),
        practiceTime,
        coachName: coachInfo?.name || 'Sin asignar',
        totalParents: parents.length,
        parentsWithEmail: parentsWithEmail.length
      }
    }

    const statusCode = result.errors.length > 0 ? 207 : 200 // 207 Multi-Status para éxito parcial

    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    console.error('Error in send-email API:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        sent: 0,
        skipped: 0
      },
      { status: 500 }
    )
  }
}

// Manejar métodos no permitidos
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed', details: 'This endpoint only accepts POST requests' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed', details: 'This endpoint only accepts POST requests' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed', details: 'This endpoint only accepts POST requests' },
    { status: 405 }
  )
}
