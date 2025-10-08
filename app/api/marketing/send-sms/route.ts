import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { verifySMSConfiguration, sendSMS, replaceSMSVariables } from "@/lib/sms-service"

interface SMSRequest {
  teamId: string
  parentIds: string[]
  message: string
}

export async function POST(request: NextRequest) {
  try {
    const { teamId, parentIds, message }: SMSRequest = await request.json()

    console.log("[SERVER] POST /api/marketing/send-sms - Starting SMS campaign", {
      selectedTeamId: teamId,
      selectedParentIds: parentIds,
      parentCount: parentIds.length,
      hasMessage: !!message,
      messageLength: message?.length
    })

    // Validar datos de entrada
    if (!teamId || !parentIds || parentIds.length === 0 || !message) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Obtener información del equipo, escuela y entrenador
    const { data: teamData, error: teamError } = await supabase
      .from("team")
      .select(`
        teamid,
        name,
        description,
        price,
        school:schoolid (
          name,
          location
        ),
        session (
          coachid,
          staff:coachid (
            name,
            email,
            phone
          )
        )
      `)
      .eq("teamid", teamId)
      .single()

    if (teamError || !teamData) {
      console.error("[SERVER] Error fetching team data:", teamError)
      return NextResponse.json(
        { error: "Error al obtener datos del equipo" },
        { status: 500 }
      )
    }

    // Obtener información de los padres y sus estudiantes usando enrollment como punto de entrada
    const { data: enrollmentData, error: parentsError } = await supabase
      .from("enrollment")
      .select(`
        enrollmentid,
        isactive,
        teamid,
        student!inner (
          studentid,
          firstname,
          lastname,
          grade,
          dob,
          ecname,
          ecphone,
          ecrelationship,
          parent!inner (
            parentid,
            firstname,
            lastname,
            email,
            phone
          )
        ),
        payment (
          paymentid,
          amount,
          date,
          status
        )
      `)
      .eq("teamid", teamId)
      .eq("isactive", true)
      .in("student.parent.parentid", parentIds)

    if (parentsError || !enrollmentData) {
      console.error("[SERVER] Error fetching enrollment data:", parentsError)
      return NextResponse.json(
        { error: "Error al obtener datos de los padres" },
        { status: 500 }
      )
    }

    console.log("[SERVER] Successfully fetched data for:", {
      selectedTeamId: teamId,
      enrollmentsFound: enrollmentData.length,
      parentIdsRequested: parentIds,
      teamName: teamData.name
    })

    // Verificar configuración de SMS
    console.log("[SERVER] Verifying SMS configuration...")
    const smsVerification = await verifySMSConfiguration()
    
    if (!smsVerification.success) {
      console.error("[SERVER] SMS configuration failed:", smsVerification.message)
      return NextResponse.json(
        { error: "Configuración de SMS no disponible: " + smsVerification.message },
        { status: 500 }
      )
    }

    console.log("[SERVER] SMS configuration verified successfully")

    // Procesar y enviar SMS
    const smsResults = []
    const schoolName = teamData.school?.name || "Escuela"
    const schoolLocation = teamData.school?.location || "Ubicación no especificada"
    const coachName = teamData.session?.[0]?.staff?.name || "Entrenador"

    // Agrupar enrollments por padre (solo los padres seleccionados)
    const parentMap = new Map()
    
    enrollmentData.forEach((enrollment: any) => {
      const parent = enrollment.student.parent
      const student = enrollment.student
      
      // Verificar que este padre esté en la lista de seleccionados
      if (!parentIds.includes(parent.parentid)) {
        console.log("[SERVER] Skipping parent not in selection:", parent.parentid)
        return
      }
      
      if (!parentMap.has(parent.parentid)) {
        parentMap.set(parent.parentid, {
          parent: parent,
          students: [],
          enrollments: []
        })
      }
      
      const parentEntry = parentMap.get(parent.parentid)
      parentEntry.students.push(student)
      parentEntry.enrollments.push(enrollment)
    })

    console.log("[SERVER] Sending SMS to", parentMap.size, "parents from selected team and parent list")

    for (const [parentId, parentData] of parentMap) {
      try {
        const { parent, students } = parentData
        
        console.log("[SERVER] Preparing SMS for selected parent:", {
          parentId: parent.parentid,
          parentName: `${parent.firstname} ${parent.lastname}`,
          parentPhone: parent.phone,
          studentsCount: students.length
        })
        
        // Obtener información de los estudiantes
        const studentNames = students.map((s: any) => `${s.firstname} ${s.lastname}`).join(", ")
        const studentGrades = students.map((s: any) => s.grade).join(", ")
        const emergencyContacts = students.map((s: any) => s.ecname).join(", ")
        const emergencyPhones = students.map((s: any) => s.ecphone).join(", ")
        const emergencyRelationships = students.map((s: any) => s.ecrelationship).join(", ")

        // Reemplazar variables en el contenido usando datos reales de la BD
        const smsVariables = {
          PARENT_NAME: `${parent.firstname} ${parent.lastname}`,
          STUDENT_NAME: studentNames,
          TEAM_NAME: teamData.name,
          SCHOOL_NAME: schoolName,
          SCHOOL_LOCATION: schoolLocation,
          COACH_NAME: coachName,
          PARENT_EMAIL: parent.email,
          PARENT_PHONE: parent.phone,
          STUDENT_GRADE: studentGrades,
          TEAM_PRICE: teamData.price ? `$${teamData.price}` : '',
          TEAM_DESCRIPTION: teamData.description || '',
          EMERGENCY_CONTACT_NAME: emergencyContacts,
          EMERGENCY_CONTACT_PHONE: emergencyPhones,
          EMERGENCY_CONTACT_RELATIONSHIP: emergencyRelationships
        }

        const personalizedMessage = replaceSMSVariables(message, smsVariables)

        // Enviar el SMS usando el servicio
        const smsResult = await sendSMS({
          to: parent.phone,
          message: personalizedMessage
        })
        
        if (smsResult.success) {
          smsResults.push({
            parentId: parent.parentid,
            phone: parent.phone,
            success: true,
            messageId: smsResult.messageId
          })
          console.log(`[SERVER] SMS sent successfully to ${parent.phone}`)
        } else {
          smsResults.push({
            parentId: parent.parentid,
            phone: parent.phone,
            success: false,
            error: smsResult.error
          })
          console.error(`[SERVER] Failed to send SMS to ${parent.phone}:`, smsResult.error)
        }
      } catch (smsError) {
        console.error(`[SERVER] Unexpected error for ${parent.phone}:`, smsError)
        smsResults.push({
          parentId: parent.parentid,
          phone: parent.phone,
          success: false,
          error: smsError instanceof Error ? smsError.message : "Error desconocido"
        })
      }
    }

    // Calcular estadísticas
    const successCount = smsResults.filter(r => r.success).length
    const failureCount = smsResults.filter(r => !r.success).length

    console.log(`[SERVER] SMS campaign completed for selected team and parents: ${successCount} success, ${failureCount} failures`)
    console.log("[SERVER] Campaign Summary:", {
      selectedTeamId: teamId,
      selectedTeamName: teamData.name,
      selectedParentCount: parentIds.length,
      smssSent: successCount,
      smssFailed: failureCount,
      totalSMSs: smsResults.length
    })

    return NextResponse.json({
      success: true,
      message: `Campaña de SMS completada para ${parentIds.length} padres seleccionados del equipo ${teamData.name}`,
      statistics: {
        total: smsResults.length,
        success: successCount,
        failures: failureCount,
        selectedTeam: teamData.name,
        selectedParentCount: parentIds.length
      },
      results: smsResults
    })

  } catch (error) {
    console.error("[SERVER] POST /api/marketing/send-sms - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Error al enviar SMS", details: message },
      { status: 500 }
    )
  }
}















