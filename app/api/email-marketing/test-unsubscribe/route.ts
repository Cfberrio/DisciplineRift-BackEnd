import { type NextRequest, NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase/server"
import { signUnsubToken } from "@/lib/mailer/unsub"

interface TestUnsubscribeRequest {
  email: string
  method?: "GET" | "POST"
}

export async function POST(request: NextRequest) {
  try {
    const body: TestUnsubscribeRequest = await request.json()
    const { email, method = "GET" } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email address',
      }, { status: 400 })
    }

    console.log(`[TEST-UNSUBSCRIBE] Starting test for email: ${email} using method ${method}`)

    const supabase = createServiceSupabaseClient()
    const steps = []

    // Step 1: Check if email exists in Newsletter
    console.log('[TEST-UNSUBSCRIBE] Step 1: Checking if email exists in Newsletter table')
    const { data: existingBefore, error: checkError } = await supabase
      .from('Newsletter')
      .select('email')
      .ilike('email', email)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[TEST-UNSUBSCRIBE] Error checking email:', checkError)
      steps.push({
        step: 1,
        name: 'Check Email Exists',
        status: 'error',
        message: `Database error: ${checkError.message}`,
      })
      return NextResponse.json({
        success: false,
        error: 'Database error checking email',
        details: checkError.message,
        steps,
      }, { status: 500 })
    }

    const emailExists = !!existingBefore
    steps.push({
      step: 1,
      name: 'Check Email Exists',
      status: 'success',
      message: emailExists 
        ? `Email ${email} found in Newsletter table` 
        : `Email ${email} NOT found in Newsletter table`,
      data: { emailExists },
    })

    console.log(`[TEST-UNSUBSCRIBE] Email exists: ${emailExists}`)

    // Step 2: Generate unsubscribe token
    console.log('[TEST-UNSUBSCRIBE] Step 2: Generating unsubscribe token')
    const token = signUnsubToken(email)
    
    steps.push({
      step: 2,
      name: 'Generate Token',
      status: 'success',
      message: 'Token generated successfully',
      data: { token: token.substring(0, 20) + '...' },
    })

    console.log(`[TEST-UNSUBSCRIBE] Token generated: ${token.substring(0, 20)}...`)

    // Step 3: Simulate clicking unsubscribe link
    console.log('[TEST-UNSUBSCRIBE] Step 3: Simulating unsubscribe link click')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const unsubscribeUrl = `${baseUrl}/api/email-marketing/unsubscribe?token=${token}`
    
    steps.push({
      step: 3,
      name: 'Unsubscribe URL',
      status: 'info',
      message: 'Unsubscribe URL generated',
      data: { url: unsubscribeUrl },
    })

    console.log(`[TEST-UNSUBSCRIBE] Unsubscribe URL: ${unsubscribeUrl}`)

    // Step 4: Call the unsubscribe endpoint
    console.log('[TEST-UNSUBSCRIBE] Step 4: Calling unsubscribe endpoint')
    
    const fetchOptions: RequestInit = method === "POST"
      ? {
          method: "POST",
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'List-Unsubscribe': 'One-Click',
          },
          body: 'List-Unsubscribe=One-Click&method=POST',
        }
      : { method: "GET" }

    const unsubscribeResponse = await fetch(unsubscribeUrl, fetchOptions)

    const unsubscribeSuccess = unsubscribeResponse.ok

    steps.push({
      step: 4,
      name: 'Call Unsubscribe Endpoint',
      status: unsubscribeSuccess ? 'success' : 'error',
      message: unsubscribeSuccess 
        ? 'Unsubscribe endpoint responded successfully'
        : `Unsubscribe endpoint failed with status ${unsubscribeResponse.status}`,
      data: { 
        statusCode: unsubscribeResponse.status,
        statusText: unsubscribeResponse.statusText,
        methodUsed: method,
      },
    })

    console.log(`[TEST-UNSUBSCRIBE] Unsubscribe response: ${unsubscribeResponse.status}`)

    // Step 5: Verify email was deleted
    console.log('[TEST-UNSUBSCRIBE] Step 5: Verifying email was deleted from Newsletter table')
    
    const { data: existingAfter, error: verifyError } = await supabase
      .from('Newsletter')
      .select('email')
      .ilike('email', email)
      .single()

    if (verifyError && verifyError.code !== 'PGRST116') {
      console.error('[TEST-UNSUBSCRIBE] Error verifying deletion:', verifyError)
      steps.push({
        step: 5,
        name: 'Verify Deletion',
        status: 'error',
        message: `Database error: ${verifyError.message}`,
      })
      return NextResponse.json({
        success: false,
        error: 'Database error verifying deletion',
        details: verifyError.message,
        steps,
      }, { status: 500 })
    }

    const emailStillExists = !!existingAfter
    const wasDeleted = emailExists && !emailStillExists

    steps.push({
      step: 5,
      name: 'Verify Deletion',
      status: wasDeleted ? 'success' : (emailExists ? 'error' : 'warning'),
      message: wasDeleted 
        ? `✓ Email ${email} was successfully deleted from Newsletter table`
        : emailStillExists 
          ? `✗ Email ${email} still exists in Newsletter table (NOT deleted)`
          : `⚠ Email ${email} was not in Newsletter table to begin with`,
      data: { 
        existedBefore: emailExists,
        existsAfter: emailStillExists,
        wasDeleted,
      },
    })

    console.log(`[TEST-UNSUBSCRIBE] Was deleted: ${wasDeleted}`)
    console.log(`[TEST-UNSUBSCRIBE] Test completed successfully`)

    return NextResponse.json({
      success: true,
      message: wasDeleted 
        ? 'Unsubscribe flow works correctly! Email was deleted.'
        : emailStillExists
          ? 'Warning: Email was NOT deleted from Newsletter table'
          : 'Warning: Email was not in Newsletter table',
      email,
      result: {
        emailExistedBefore: emailExists,
        emailExistsAfter: emailStillExists,
        wasSuccessfullyDeleted: wasDeleted,
      },
      steps,
      recommendation: !emailExists 
        ? 'Add this email to Newsletter table first, then test again'
        : wasDeleted
          ? 'Unsubscribe is working perfectly!'
          : 'Check the logs and unsubscribe endpoint for errors',
    })

  } catch (error: any) {
    console.error('[TEST-UNSUBSCRIBE] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during test',
      details: error.message,
    }, { status: 500 })
  }
}



