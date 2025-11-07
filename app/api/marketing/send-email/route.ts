import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import nodemailer from "nodemailer"

interface EmailRequest {
  teamId: string
  parentIds: string[]
  subject: string
  content: string
  templateId?: number
  isHtml?: boolean
}

// Create email transporter with Gmail configuration
function createEmailTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.')
  }

  console.log('[EMAIL] Using Gmail configuration')
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

// Verify email configuration
async function verifyEmailConfiguration() {
  try {
    const transporter = createEmailTransporter()
    await transporter.verify()
    return { success: true, message: 'Email configuration verified' }
  } catch (error) {
    console.error('Email configuration verification failed:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Send email function
async function sendEmail(mailOptions: {
  from?: string
  to: string
  subject: string
  html: string
}) {
  try {
    const transporter = createEmailTransporter()
    
    const emailOptions = {
      from: mailOptions.from || process.env.GMAIL_USER,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html
    }

    console.log('[EMAIL] Sending email to:', emailOptions.to)
    console.log('[EMAIL] Subject:', emailOptions.subject)
    console.log('[EMAIL] From:', emailOptions.from)
    
    const info = await transporter.sendMail(emailOptions)
    
    console.log('[EMAIL] Email sent successfully:', info.messageId)
    return {
      success: true,
      messageId: info.messageId,
      email: emailOptions.to
    }
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      email: mailOptions.to
    }
  }
}

// Replace email variables function
function replaceEmailVariables(
  content: string,
  variables: Record<string, string | number | undefined>
) {
  let processedContent = content
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`
    const replacement = value?.toString() || ''
    processedContent = processedContent.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement)
  })
  
  return processedContent
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
          error: "Error al obtener datos del equipo",
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

    // Verify email configuration
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
        
        // Get students information
        const studentNames = students.map((s: any) => `${s.firstname} ${s.lastname}`).join(", ")
        const studentFirstNames = students.map((s: any) => s.firstname).join(", ")
        const studentGrades = students.map((s: any) => s.grade).join(", ")
        const emergencyContacts = students.map((s: any) => s.ecname).join(", ")
        const emergencyPhones = students.map((s: any) => s.ecphone).join(", ")
        const emergencyRelationships = students.map((s: any) => s.ecrelationship).join(", ")

        // Reemplazar variables en el asunto y contenido usando datos reales de la BD
        const emailVariables = {
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

        const personalizedSubject = replaceEmailVariables(subject, emailVariables)
        const personalizedContent = replaceEmailVariables(content, emailVariables)

        // Prepare email content
        const emailHtml = isHtml ? personalizedContent : `
          <!DOCTYPE html>
          <html lang="en">
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
              <p>Team Communication System</p>
            </div>
            <div class="content">
              ${personalizedContent}
            </div>
            <div class="footer">
              <p>This email was sent from ${schoolName} management system</p>
              <p>If you have any questions, contact coach ${coachName} directly</p>
            </div>
          </body>
          </html>
        `

        // Send the email using the improved service
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
          error: emailError instanceof Error ? emailError.message : "Unknown error"
        })
      }
    }

    // Calculate statistics
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
      message: `Email campaign completed for ${parentIds.length} selected parents from team ${teamData.name}`,
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
