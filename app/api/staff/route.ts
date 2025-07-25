import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/server"

export async function GET() {
  try {
    const { data: staff, error } = await supabase.from("staff").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching staff:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(staff || [])
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data: staff, error } = await supabase.from("staff").insert([body]).select().single()

    if (error) {
      console.error("Error creating staff:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
