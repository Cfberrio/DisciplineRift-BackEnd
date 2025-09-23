import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  try {
    console.log("📋 Fetching all newsletter emails...")

    // Try to get data from Newsletter table (with capital N)
    const { data: newsletters, error } = await supabaseAdmin
      .from('Newsletter')
      .select('email')

    if (error) {
      console.error("❌ Newsletter query error:", error)
      return NextResponse.json({
        success: false,
        message: "Database query error",
        error: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log(`📊 Newsletter query result:`, newsletters)

    if (!newsletters || newsletters.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No newsletter subscribers found",
        emails: [],
        count: 0
      })
    }

    // Extract emails
    const emails = newsletters.map(n => n.email).filter(email => email && email.trim() !== '')

    return NextResponse.json({
      success: true,
      message: `Found ${emails.length} newsletter emails`,
      emails: emails,
      count: emails.length
    })

  } catch (error) {
    console.error("❌ Error getting newsletter emails:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to get newsletter emails",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
