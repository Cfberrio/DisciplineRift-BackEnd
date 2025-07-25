import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("Schools API: Starting GET request")

    const { data: schools, error } = await supabase.from("schools").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Schools API: Database error:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch schools",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Schools API: Successfully fetched", schools?.length || 0, "schools")
    return NextResponse.json(schools || [])
  } catch (error) {
    console.error("Schools API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log("Schools API: Starting POST request")

    const body = await request.json()
    const { name, address, phone, email, principal } = body

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const { data: newSchool, error } = await supabase
      .from("schools")
      .insert([
        {
          name: name.trim(),
          address: address?.trim() || null,
          phone: phone?.trim() || null,
          email: email?.trim() || null,
          principal: principal?.trim() || null,
        },
      ])
      .select("*")
      .single()

    if (error) {
      console.error("Schools API: Insert error:", error)
      return NextResponse.json(
        {
          error: "Failed to create school",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Schools API: Successfully created school:", newSchool.id)
    return NextResponse.json(newSchool, { status: 201 })
  } catch (error) {
    console.error("Schools API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
