import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: service, error } = await supabase.from("services").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Services API: Get error:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch service",
          details: error.message,
        },
        { status: 500 },
      )
    }

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    return NextResponse.json(service)
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, description, category, price, status } = body

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const { data: updatedService, error } = await supabase
      .from("services")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        price: price || null,
        status: status || "active",
      })
      .eq("id", params.id)
      .select("*")
      .single()

    if (error) {
      console.error("Services API: Update error:", error)
      return NextResponse.json(
        {
          error: "Failed to update service",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(updatedService)
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("services").delete().eq("id", params.id)

    if (error) {
      console.error("Services API: Delete error:", error)
      return NextResponse.json(
        {
          error: "Failed to delete service",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
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
