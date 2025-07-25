import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/server"

export async function GET() {
  try {
    console.log("Services API: Starting GET request")

    const { data: services, error } = await supabase.from("services").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Services API: Database error:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch services",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Services API: Successfully fetched", services?.length || 0, "services")
    return NextResponse.json(services || [])
  } catch (error) {
    console.error("Services API: Unexpected error:", error)
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
    console.log("Services API: Starting POST request")

    const body = await request.json()
    const { name, description, category, price, status } = body

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const { data: newService, error } = await supabase
      .from("services")
      .insert([
        {
          name: name.trim(),
          description: description?.trim() || null,
          category: category?.trim() || null,
          price: price || null,
          status: status || "active",
        },
      ])
      .select("*")
      .single()

    if (error) {
      console.error("Services API: Insert error:", error)
      return NextResponse.json(
        {
          error: "Failed to create service",
          details: error.message,
        },
        { status: 500 },
      )
    }

    console.log("Services API: Successfully created service:", newService.id)
    return NextResponse.json(newService, { status: 201 })
  } catch (error) {
    console.error("Services API: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
