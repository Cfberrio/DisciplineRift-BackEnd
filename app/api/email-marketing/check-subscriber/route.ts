import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email parameter is required',
      }, { status: 400 })
    }

    console.log(`[CHECK-SUBSCRIBER] Checking if email exists: ${email}`)

    const supabase = createServerSupabaseClient()
    
    const { data, error, count } = await supabase
      .from('Newsletter')
      .select('*', { count: 'exact' })
      .eq('email', email)

    if (error) {
      console.error('[CHECK-SUBSCRIBER] Database error:', error)
      return NextResponse.json({
        success: false,
        error: 'Database error',
        details: error.message,
      }, { status: 500 })
    }

    const exists = data && data.length > 0
    console.log(`[CHECK-SUBSCRIBER] Result: ${exists ? 'EXISTS' : 'NOT FOUND'}`)

    return NextResponse.json({
      success: true,
      email,
      exists,
      count: count || 0,
      data: exists ? data[0] : null,
    })

  } catch (error: any) {
    console.error('[CHECK-SUBSCRIBER] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message,
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required',
      }, { status: 400 })
    }

    console.log(`[CHECK-SUBSCRIBER] Adding email to Newsletter: ${email}`)

    const supabase = createServerSupabaseClient()
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('Newsletter')
      .select('email')
      .eq('email', email)
      .single()

    if (existing) {
      console.log(`[CHECK-SUBSCRIBER] Email already exists: ${email}`)
      return NextResponse.json({
        success: true,
        message: 'Email already subscribed',
        email,
        alreadyExists: true,
      })
    }

    // Add to Newsletter
    const { data, error } = await supabase
      .from('Newsletter')
      .insert([{ email }])
      .select()

    if (error) {
      console.error('[CHECK-SUBSCRIBER] Error adding email:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to add email',
        details: error.message,
      }, { status: 500 })
    }

    console.log(`[CHECK-SUBSCRIBER] ✓ Email added successfully: ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Email added to Newsletter successfully',
      email,
      data: data[0],
    })

  } catch (error: any) {
    console.error('[CHECK-SUBSCRIBER] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error.message,
    }, { status: 500 })
  }
}







