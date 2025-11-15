import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get count of all subscribers
    const { count, error } = await supabase
      .from('Newsletter')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error("Error fetching subscriber count:", error)
      return NextResponse.json(
        { error: "Failed to fetch subscriber count", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
    })

  } catch (error) {
    console.error("Error in subscribers endpoint:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscribers", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}


