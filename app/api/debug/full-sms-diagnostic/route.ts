import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const diagnostic: any = {
    timestamp: new Date().toISOString(),
    checks: [],
    errors: [],
    warnings: []
  }

  try {
    const { teamId, parentIds } = await request.json()

    // CHECK 1: Twilio Configuration
    console.log('[DIAGNOSTIC] Checking Twilio configuration...')
    const twilioCheck = {
      name: 'Twilio Configuration',
      status: 'checking'
    }
    
    if (!process.env.TWILIO_ACCOUNT_SID) {
      twilioCheck.status = 'failed'
      twilioCheck.error = 'TWILIO_ACCOUNT_SID not set'
      diagnostic.errors.push('Missing TWILIO_ACCOUNT_SID environment variable')
    } else if (!process.env.TWILIO_AUTH_TOKEN) {
      twilioCheck.status = 'failed'
      twilioCheck.error = 'TWILIO_AUTH_TOKEN not set'
      diagnostic.errors.push('Missing TWILIO_AUTH_TOKEN environment variable')
    } else if (!process.env.TWILIO_PHONE_NUMBER) {
      twilioCheck.status = 'failed'
      twilioCheck.error = 'TWILIO_PHONE_NUMBER not set'
      diagnostic.errors.push('Missing TWILIO_PHONE_NUMBER environment variable')
    } else {
      twilioCheck.status = 'passed'
      twilioCheck.details = {
        accountSidLength: process.env.TWILIO_ACCOUNT_SID.length,
        accountSidPrefix: process.env.TWILIO_ACCOUNT_SID.substring(0, 2),
        authTokenLength: process.env.TWILIO_AUTH_TOKEN.length,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER
      }
    }
    diagnostic.checks.push(twilioCheck)

    // CHECK 2: Twilio Library
    console.log('[DIAGNOSTIC] Checking Twilio library...')
    const twilioLibCheck = {
      name: 'Twilio Library',
      status: 'checking'
    }
    
    try {
      const twilio = require('twilio')
      twilioLibCheck.status = 'passed'
      twilioLibCheck.details = { installed: true }
    } catch (error) {
      twilioLibCheck.status = 'failed'
      twilioLibCheck.error = 'Twilio library not installed'
      diagnostic.errors.push('Twilio library is not installed. Run: npm install twilio')
    }
    diagnostic.checks.push(twilioLibCheck)

    // CHECK 3: Database Connection
    console.log('[DIAGNOSTIC] Checking database connection...')
    const dbCheck = {
      name: 'Database Connection',
      status: 'checking'
    }
    
    try {
      const supabase = await createServerSupabaseClient()
      
      // Try a simple query
      const { data, error } = await supabase.from('team').select('teamid').limit(1)
      
      if (error) {
        dbCheck.status = 'failed'
        dbCheck.error = error.message
        diagnostic.errors.push(`Database error: ${error.message}`)
      } else {
        dbCheck.status = 'passed'
        dbCheck.details = { connected: true }
      }
    } catch (error) {
      dbCheck.status = 'failed'
      dbCheck.error = error instanceof Error ? error.message : 'Unknown error'
      diagnostic.errors.push('Cannot connect to database')
    }
    diagnostic.checks.push(dbCheck)

    // CHECK 4: Team Data (if teamId provided)
    if (teamId) {
      console.log('[DIAGNOSTIC] Checking team data...')
      const teamCheck = {
        name: 'Team Data',
        status: 'checking',
        teamId: teamId
      }
      
      try {
        const supabase = await createServerSupabaseClient()
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
            )
          `)
          .eq("teamid", teamId)
          .single()

        if (teamError || !teamData) {
          teamCheck.status = 'failed'
          teamCheck.error = teamError?.message || 'Team not found'
          diagnostic.errors.push(`Team data error: ${teamError?.message || 'Team not found'}`)
        } else {
          teamCheck.status = 'passed'
          teamCheck.details = {
            teamName: teamData.name,
            hasSchool: !!teamData.school,
            schoolName: teamData.school?.name
          }
        }
      } catch (error) {
        teamCheck.status = 'failed'
        teamCheck.error = error instanceof Error ? error.message : 'Unknown error'
        diagnostic.errors.push('Cannot fetch team data')
      }
      diagnostic.checks.push(teamCheck)
    }

    // CHECK 5: Parent Data (if parentIds provided)
    if (teamId && parentIds && parentIds.length > 0) {
      console.log('[DIAGNOSTIC] Checking parent data...')
      const parentCheck = {
        name: 'Parent Data',
        status: 'checking',
        requestedParents: parentIds.length
      }
      
      try {
        const supabase = await createServerSupabaseClient()
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
              parent!inner (
                parentid,
                firstname,
                lastname,
                email,
                phone
              )
            )
          `)
          .eq("teamid", teamId)
          .eq("isactive", true)
          .in("student.parent.parentid", parentIds)

        if (parentsError) {
          parentCheck.status = 'failed'
          parentCheck.error = parentsError.message
          diagnostic.errors.push(`Parent data error: ${parentsError.message}`)
        } else if (!enrollmentData || enrollmentData.length === 0) {
          parentCheck.status = 'failed'
          parentCheck.error = 'No enrollments found for selected parents'
          diagnostic.warnings.push('No active enrollments found for the selected parents and team')
        } else {
          const parentPhones = enrollmentData.map((e: any) => ({
            parentId: e.student.parent.parentid,
            name: `${e.student.parent.firstname} ${e.student.parent.lastname}`,
            phone: e.student.parent.phone,
            hasPhone: !!e.student.parent.phone,
            phoneLength: e.student.parent.phone?.length || 0
          }))
          
          const phonesWithIssues = parentPhones.filter(p => !p.hasPhone || p.phoneLength < 10)
          
          parentCheck.status = phonesWithIssues.length === 0 ? 'passed' : 'warning'
          parentCheck.details = {
            enrollmentsFound: enrollmentData.length,
            uniqueParents: new Set(enrollmentData.map((e: any) => e.student.parent.parentid)).size,
            parentPhones: parentPhones,
            phonesWithIssues: phonesWithIssues
          }
          
          if (phonesWithIssues.length > 0) {
            diagnostic.warnings.push(`${phonesWithIssues.length} parent(s) have invalid phone numbers`)
          }
        }
      } catch (error) {
        parentCheck.status = 'failed'
        parentCheck.error = error instanceof Error ? error.message : 'Unknown error'
        diagnostic.errors.push('Cannot fetch parent data')
      }
      diagnostic.checks.push(parentCheck)
    }

    // CHECK 6: Twilio API Connection Test
    if (twilioCheck.status === 'passed' && twilioLibCheck.status === 'passed') {
      console.log('[DIAGNOSTIC] Testing Twilio API connection...')
      const twilioApiCheck = {
        name: 'Twilio API Connection',
        status: 'checking'
      }
      
      try {
        const twilio = require('twilio')
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        
        // Try to fetch account info
        const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch()
        
        twilioApiCheck.status = 'passed'
        twilioApiCheck.details = {
          accountStatus: account.status,
          accountType: account.type,
          accountSid: account.sid
        }
      } catch (error: any) {
        twilioApiCheck.status = 'failed'
        twilioApiCheck.error = error.message || 'Cannot connect to Twilio API'
        diagnostic.errors.push(`Twilio API error: ${error.message || 'Connection failed'}`)
        
        // Add specific error details
        if (error.code) {
          twilioApiCheck.errorCode = error.code
        }
        if (error.status) {
          twilioApiCheck.httpStatus = error.status
        }
      }
      diagnostic.checks.push(twilioApiCheck)
    }

    // Summary
    diagnostic.summary = {
      totalChecks: diagnostic.checks.length,
      passed: diagnostic.checks.filter((c: any) => c.status === 'passed').length,
      failed: diagnostic.checks.filter((c: any) => c.status === 'failed').length,
      warnings: diagnostic.checks.filter((c: any) => c.status === 'warning').length,
      criticalErrors: diagnostic.errors.length,
      canSendSMS: diagnostic.errors.length === 0
    }

    console.log('[DIAGNOSTIC] Full diagnostic completed:', diagnostic.summary)

    return NextResponse.json({
      success: diagnostic.summary.canSendSMS,
      diagnostic: diagnostic
    })

  } catch (error) {
    console.error("[DIAGNOSTIC] Error during diagnostic:", error)
    return NextResponse.json(
      { 
        success: false,
        error: "Diagnostic failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}





















