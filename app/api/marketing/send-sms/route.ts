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

    // Get team, school and coach information
    const { data: teamData, error: teamError } = await supabase
      .from("team")
      .select(`
        teamid,
        name,
        sport,
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
      console.error("[SERVER] Error fetching team data:", {
        error: teamError,
        message: teamError?.message,
        details: teamError?.details,
        hint: teamError?.hint,
        code: teamError?.code
      })
      return NextResponse.json(
        { 
          error: "Error fetching team data",
          details: teamError?.message || "Unknown error",
          hint: teamError?.hint
        },
        { status: 500 }
      )
    }

    // Get parents and their students information using enrollment as entry point
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
        { error: "Error fetching parent data" },
        { status: 500 }
      )
    }

    console.log("[SERVER] Successfully fetched data for:", {
      selectedTeamId: teamId,
      enrollmentsFound: enrollmentData.length,
      parentIdsRequested: parentIds,
      teamName: teamData.name
    })

    // Verify SMS configuration
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

    // Process and send SMS
    const smsResults = []
    const schoolName = teamData.school?.name || "School"
    const schoolLocation = teamData.school?.location || "Location not specified"
    const coachName = teamData.session?.[0]?.staff?.name || "Coach"

    // Group enrollments by parent (only selected parents)
    const parentMap = new Map()
    
    enrollmentData.forEach((enrollment: any) => {
      const parent = enrollment.student.parent
      const student = enrollment.student
      
      // Verify that this parent is in the selected list
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
        
        // Get students information
        const studentNames = students.map((s: any) => `${s.firstname} ${s.lastname}`).join(", ")
        const studentFirstNames = students.map((s: any) => s.firstname).join(", ")
        const studentGrades = students.map((s: any) => s.grade).join(", ")
        const emergencyContacts = students.map((s: any) => s.ecname).join(", ")
        const emergencyPhones = students.map((s: any) => s.ecphone).join(", ")
        const emergencyRelationships = students.map((s: any) => s.ecrelationship).join(", ")

        // Reemplazar variables en el contenido usando datos reales de la BD
        const smsVariables = {
          PARENT_NAME: `${parent.firstname} ${parent.lastname}`,
          PARENT_FIRSTNAME: parent.firstname,
          STUDENT_NAME: studentNames,
          STUDENT_FIRSTNAME: studentFirstNames,
          TEAM_NAME: teamData.name,
          SPORT: teamData.sport || '',
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
          error: smsError instanceof Error ? smsError.message : "Unknown error"
        })
      }
    }

    // Calculate statistics
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
      message: `SMS campaign completed for ${parentIds.length} selected parents from team ${teamData.name}`,
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
      { error: "Error sending SMS", details: message },
      { status: 500 }
    )
  }
}

























