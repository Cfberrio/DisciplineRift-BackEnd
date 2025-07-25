import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { data: school, error } = await supabase.from("schools").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Schools API: Get error:", error)
      return NextResponse.json(
        {
          error: "Failed to fetch school",
          details: error.message,
        },
        { status: 500 },
      )
    }

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 })
    }

    return NextResponse.json(school)
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { name, address, phone, email, principal } = body

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const { data: updatedSchool, error } = await supabase
      .from("schools")
      .update({
        name: name.trim(),
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        principal: principal?.trim() || null,
      })
      .eq("id", params.id)
      .select("*")
      .single()

    if (error) {
      console.error("Schools API: Update error:", error)
      return NextResponse.json(
        {
          error: "Failed to update school",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(updatedSchool)
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabase.from("schools").delete().eq("id", params.id)

    if (error) {
      console.error("Schools API: Delete error:", error)
      return NextResponse.json(
        {
          error: "Failed to delete school",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
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
