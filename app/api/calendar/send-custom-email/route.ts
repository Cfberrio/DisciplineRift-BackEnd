import { NextRequest, NextResponse } from 'next/server'
import { DateTime } from 'luxon'
import { 
  getSessionById,
  getTeamName,
  getParentsByTeam,
  getCoachInfo
} from '@/lib/calendar/supabase-client'
import { sendMail, isEmailConfigured } from '@/lib/mailer'
import { expandOccurrences } from '@/utils/schedule'
import { supabase } from '@/lib/supabase/client'

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
    const { teamid, sessionid, occurrence, subject, htmlTemplate } = body

    // Validar parámetros requeridos
    if (!teamid || !sessionid || !subject || !htmlTemplate) {
      return NextResponse.json(
        { error: 'Missing required parameters', details: 'teamid, sessionid, subject, and htmlTemplate are required' },
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

    // Obtener padres del equipo con información de estudiantes
    const parentsWithStudents = await getParentsWithStudentInfo(teamid)
    
    if (parentsWithStudents.length === 0) {
      return NextResponse.json(
        { 
          error: 'No recipients found', 
          details: 'No parents with valid email addresses found for this team',
          sent: 0,
          skipped: 0
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
            skipped: parentsWithStudents.length
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

    // Enviar emails personalizados
    let sentCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const parentInfo of parentsWithStudents) {
      if (!parentInfo.email) {
        skippedCount++
        continue
      }

      try {
        // Personalizar el contenido HTML para cada padre
        const personalizedSubject = subject
          .replace(/{teamName}/g, teamName)
          .replace(/{parentName}/g, parentInfo.parentName)
          .replace(/{studentName}/g, parentInfo.studentNames.join(' y '))

        const personalizedHtml = htmlTemplate
          .replace(/{parentName}/g, parentInfo.parentName)
          .replace(/{studentName}/g, parentInfo.studentNames.join(' y '))
          .replace(/{teamName}/g, teamName)
          .replace(/{practiceDate}/g, practiceDate.toFormat('cccc, d \'de\' LLLL \'del\' yyyy'))
          .replace(/{practiceTime}/g, practiceTime)
          .replace(/{coachName}/g, coachInfo?.name || 'Sin asignar')

        await sendMail({
          to: [parentInfo.email],
          subject: personalizedSubject,
          html: personalizedHtml
        })

        sentCount++
      } catch (error) {
        errors.push(`Error enviando a ${parentInfo.email}: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        skippedCount++
      }

      // Pequeña pausa para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Preparar respuesta
    const response = {
      sent: sentCount,
      skipped: skippedCount,
      errors,
      details: {
        teamName,
        practiceDate: practiceDate.toFormat('yyyy-LL-dd'),
        practiceTime,
        coachName: coachInfo?.name || 'Sin asignar',
        totalParents: parentsWithStudents.length,
        parentsWithEmail: parentsWithStudents.filter(p => p.email).length
      }
    }

    const statusCode = errors.length > 0 ? 207 : 200 // 207 Multi-Status para éxito parcial

    return NextResponse.json(response, { status: statusCode })

  } catch (error) {
    console.error('Error in send-custom-email API:', error)
    
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

/**
 * Obtiene padres con información de sus estudiantes para personalización
 */
async function getParentsWithStudentInfo(teamid: string) {
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

    // 2. Obtener estudiantes con información de padres
    const { data: students, error: studentError } = await supabase
      .from('student')
      .select('studentid, parentid, firstname, lastname')
      .in('studentid', studentIds)

    if (studentError) {
      console.error('Error fetching students:', studentError)
      return []
    }

    // 3. Obtener información de los padres
    const parentIds = [...new Set((students || []).map(s => s.parentid))]
    if (parentIds.length === 0) return []

    const { data: parents, error: parentError } = await supabase
      .from('parent')
      .select('parentid, firstname, lastname, email')
      .in('parentid', parentIds)

    if (parentError) {
      console.error('Error fetching parents:', parentError)
      return []
    }

    // 4. Agrupar estudiantes por padre
    const parentsMap = new Map()
    
    parents?.forEach(parent => {
      if (parent) {
        parentsMap.set(parent.parentid, {
          parentid: parent.parentid,
          parentName: `${parent.firstname} ${parent.lastname}`.trim(),
          email: parent.email,
          studentNames: []
        })
      }
    })

    students?.forEach(student => {
      if (student && parentsMap.has(student.parentid)) {
        const studentName = `${student.firstname} ${student.lastname}`.trim()
        parentsMap.get(student.parentid).studentNames.push(studentName)
      }
    })

    return Array.from(parentsMap.values()).filter(parent => parent.email)
  } catch (error) {
    console.error('Error in getParentsWithStudentInfo:', error)
    return []
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
