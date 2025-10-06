import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createEmailTransporter, verifyEmailConfiguration, sendEmail, replaceEmailVariables } from "@/lib/email-service"

interface EmailRequest {
  teamId: string
  parentIds: string[]
  subject: string
  content: string
  templateId?: number
  isHtml?: boolean
}


export async function POST(request: NextRequest) {
  try {
    const { teamId, parentIds, subject, content, templateId, isHtml }: EmailRequest = await request.json()

    
    console.log("[SERVER] POST /api/marketing/send-email - Starting email campaign", {
      selectedTeamId: teamId,
      selectedParentIds: parentIds,
      parentCount: parentIds.length,
      templateId,
      isHtml,
      hasSubject: !!subject,
      hasContent: !!content
    })

    // Validar datos de entrada
    if (!teamId || !parentIds || parentIds.length === 0 || !subject || !content) {
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

    // Verificar configuración de email
    console.log("[SERVER] Verifying email configuration...")
    const emailVerification = await verifyEmailConfiguration()
    
    if (!emailVerification.success) {
      console.error("[SERVER] Email configuration failed:", emailVerification.message)
      return NextResponse.json(
        { error: "Configuración de email no disponible: " + emailVerification.message },
        { status: 500 }
      )
    }

    console.log("[SERVER] Email configuration verified successfully")

    // Procesar y enviar emails
    const emailResults = []
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

    console.log("[SERVER] Sending emails to", parentMap.size, "parents from selected team and parent list")

    for (const [parentId, parentData] of parentMap) {
      try {
        const { parent, students } = parentData
        
        console.log("[SERVER] Preparing email for selected parent:", {
          parentId: parent.parentid,
          parentName: `${parent.firstname} ${parent.lastname}`,
          parentEmail: parent.email,
          studentsCount: students.length
        })
        
        // Obtener información de los estudiantes
        const studentNames = students.map((s: any) => `${s.firstname} ${s.lastname}`).join(", ")
        const studentGrades = students.map((s: any) => s.grade).join(", ")
        const emergencyContacts = students.map((s: any) => s.ecname).join(", ")
        const emergencyPhones = students.map((s: any) => s.ecphone).join(", ")
        const emergencyRelationships = students.map((s: any) => s.ecrelationship).join(", ")

        // Reemplazar variables en el asunto y contenido usando datos reales de la BD
        const emailVariables = {
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

        const personalizedSubject = replaceEmailVariables(subject, emailVariables)
        const personalizedContent = replaceEmailVariables(content, emailVariables)

        // Preparar contenido del email
        const emailHtml = isHtml ? personalizedContent : `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${personalizedSubject}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                border-radius: 8px 8px 0 0;
                border-bottom: 3px solid #007bff;
              }
              .content {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .footer {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
                border-top: 1px solid #eee;
                margin-top: 20px;
              }
              h1, h2, h3 {
                color: #007bff;
              }
              ul {
                padding-left: 20px;
              }
              li {
                margin-bottom: 5px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${schoolName}</h1>
              <p>Sistema de Comunicación de Equipos</p>
            </div>
            <div class="content">
              ${personalizedContent}
            </div>
            <div class="footer">
              <p>Este email fue enviado desde el sistema de gestión de ${schoolName}</p>
              <p>Si tienes alguna pregunta, contacta directamente con el entrenador ${coachName}</p>
            </div>
          </body>
          </html>
        `

        // Enviar el email usando el servicio mejorado
        const emailResult = await sendEmail({
          to: parent.email,
          subject: personalizedSubject,
          html: emailHtml
        })
        
        if (emailResult.success) {
          emailResults.push({
            parentId: parent.parentid,
            email: parent.email,
            success: true,
            messageId: emailResult.messageId
          })
          console.log(`[SERVER] Email sent successfully to ${parent.email}`)
        } else {
          emailResults.push({
            parentId: parent.parentid,
            email: parent.email,
            success: false,
            error: emailResult.error
          })
          console.error(`[SERVER] Failed to send email to ${parent.email}:`, emailResult.error)
        }
      } catch (emailError) {
        console.error(`[SERVER] Unexpected error for ${parent.email}:`, emailError)
        emailResults.push({
          parentId: parent.parentid,
          email: parent.email,
          success: false,
          error: emailError instanceof Error ? emailError.message : "Error desconocido"
        })
      }
    }

    // Calcular estadísticas
    const successCount = emailResults.filter(r => r.success).length
    const failureCount = emailResults.filter(r => !r.success).length

    console.log(`[SERVER] Email campaign completed for selected team and parents: ${successCount} success, ${failureCount} failures`)
    console.log("[SERVER] Campaign Summary:", {
      selectedTeamId: teamId,
      selectedTeamName: teamData.name,
      selectedParentCount: parentIds.length,
      emailsSent: successCount,
      emailsFailed: failureCount,
      totalEmails: emailResults.length
    })

    return NextResponse.json({
      success: true,
      message: `Campaña de email completada para ${parentIds.length} padres seleccionados del equipo ${teamData.name}`,
      statistics: {
        total: emailResults.length,
        success: successCount,
        failures: failureCount,
        selectedTeam: teamData.name,
        selectedParentCount: parentIds.length
      },
      results: emailResults
    })

  } catch (error) {
    console.error("[SERVER] POST /api/marketing/send-email - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Error al enviar emails", details: message },
      { status: 500 }
    )
  }
}
