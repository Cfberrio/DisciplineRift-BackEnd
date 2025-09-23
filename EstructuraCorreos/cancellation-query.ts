import { supabaseAdmin } from "@/lib/supabase-admin"

export interface CancellationRecipient {
  parentId: string
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  teamId: string
  teamName: string
  schoolName: string
}

/**
 * Obtiene la lista de destinatarios para emails de cancelación
 * Selecciona padres que cumplen TODAS las condiciones:
 * - team.isactive = FALSE (equipos cancelados)
 * - enrollment.isactive = TRUE (inscripción activa)
 * - De-duplicación por (parent, team)
 */
export async function getCancellationRecipients(): Promise<{
  success: boolean
  data?: CancellationRecipient[]
  error?: string
  count?: number
}> {
  try {
    console.log('🔍 Ejecutando consulta de destinatarios de cancelación...')

    // Consulta principal con joins y filtros
    const { data: enrollments, error: queryError } = await supabaseAdmin
      .from('enrollment')
      .select(`
        enrollmentid,
        isactive,
        student:studentid (
          studentid,
          firstname,
          lastname,
          parent:parentid (
            parentid,
            firstname,
            lastname,
            email
          )
        ),
        team:teamid (
          teamid,
          name,
          isactive,
          school:schoolid (
            schoolid,
            name
          )
        )
      `)
      .eq('isactive', true)  // Solo inscripciones activas
      .eq('team.isactive', false)  // Solo equipos cancelados (inactivos)

    if (queryError) {
      console.error('❌ Error en consulta:', queryError)
      return {
        success: false,
        error: `Error de consulta: ${queryError.message}`
      }
    }

    if (!enrollments || enrollments.length === 0) {
      console.log('ℹ️ No se encontraron destinatarios para cancelación')
      return {
        success: true,
        data: [],
        count: 0
      }
    }

    console.log(`📊 Encontrados ${enrollments.length} registros potenciales`)

    // Procesar y de-duplicar resultados
    const recipients = new Map<string, CancellationRecipient>()

    for (const enrollment of enrollments) {
      try {
        // Validar datos requeridos
        if (!enrollment.student?.parent?.email) {
          console.warn('⚠️ Registro sin email del padre, saltando:', enrollment.enrollmentid)
          continue
        }

        if (!enrollment.team?.name) {
          console.warn('⚠️ Registro sin nombre de equipo, saltando:', enrollment.enrollmentid)
          continue
        }

        if (!enrollment.team?.school?.name) {
          console.warn('⚠️ Registro sin nombre de escuela, saltando:', enrollment.enrollmentid)
          continue
        }

        // Validar email
        const email = enrollment.student.parent.email.trim()
        if (!email || !email.includes('@')) {
          console.warn('⚠️ Email inválido, saltando:', email)
          continue
        }

        // Crear clave de de-duplicación (parent + team)
        const dedupeKey = `${enrollment.student.parent.parentid}-${enrollment.team.teamid}`

        // Verificar si ya existe esta combinación
        if (recipients.has(dedupeKey)) {
          console.log(`🔄 Duplicado encontrado para ${email} en ${enrollment.team.name}, saltando`)
          continue
        }

        // Construir nombre del padre con fallback
        const firstName = enrollment.student.parent.firstname?.trim() || 'Parent'
        const lastName = enrollment.student.parent.lastname?.trim() || ''
        
        const recipient: CancellationRecipient = {
          parentId: enrollment.student.parent.parentid,
          parentFirstName: firstName,
          parentLastName: lastName,
          parentEmail: email,
          teamId: enrollment.team.teamid,
          teamName: enrollment.team.name,
          schoolName: enrollment.team.school.name
        }

        recipients.set(dedupeKey, recipient)

      } catch (processingError) {
        console.error('❌ Error procesando registro:', enrollment.enrollmentid, processingError)
        continue
      }
    }

    const finalRecipients = Array.from(recipients.values())
    
    console.log(`✅ Procesamiento completado: ${finalRecipients.length} destinatarios únicos`)
    
    return {
      success: true,
      data: finalRecipients,
      count: finalRecipients.length
    }

  } catch (error) {
    console.error('❌ Error en getCancellationRecipients:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Versión de prueba con límite para testing
 */
export async function getCancellationRecipientsWithLimit(limit: number = 5): Promise<{
  success: boolean
  data?: CancellationRecipient[]
  error?: string
  count?: number
}> {
  const result = await getCancellationRecipients()
  
  if (result.success && result.data) {
    return {
      ...result,
      data: result.data.slice(0, limit),
      count: result.data.length // Mantener el conteo total
    }
  }
  
  return result
}





