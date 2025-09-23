import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("[SERVER] GET /api/teams/[id]/parents - Starting request for team ID:", params.id)

    const supabase = await createServerSupabaseClient()

    // Query para obtener padres de estudiantes activos en un equipo específico
    const { data, error } = await supabase
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
      .eq("teamid", params.id)
      .eq("isactive", true)

    if (error) {
      console.error("[SERVER] GET /api/teams/[id]/parents - Supabase error:", error)
      return NextResponse.json(
        { error: "Failed to fetch parents", details: error.message },
        { status: 500 }
      )
    }

    console.log("[SERVER] GET /api/teams/[id]/parents - Raw data length:", data?.length || 0)
    if (data && data.length > 0) {
      console.log("[SERVER] GET /api/teams/[id]/parents - Sample enrollment:", JSON.stringify(data[0], null, 2))
    }

    // Procesar los datos para eliminar duplicados de padres y estructurar la respuesta
    const parentMap = new Map()
    
    data?.forEach((enrollment: any) => {
      const parent = enrollment.student.parent
      const student = enrollment.student
      
      if (!parentMap.has(parent.parentid)) {
        parentMap.set(parent.parentid, {
          parentid: parent.parentid,
          firstname: parent.firstname,
          lastname: parent.lastname,
          email: parent.email,
          phone: parent.phone,
          students: []
        })
      }
      
      const parentEntry = parentMap.get(parent.parentid)
        
      parentEntry.students.push({
        studentid: student.studentid,
        firstname: student.firstname,
        lastname: student.lastname,
        enrollmentid: enrollment.enrollmentid,
        totalPaid: 0 // No necesitamos calcular pagos por ahora
      })
    })

    const parents = Array.from(parentMap.values())

    console.log("[SERVER] GET /api/teams/[id]/parents - Success, found parents:", parents.length)
    return NextResponse.json(parents)
  } catch (error) {
    console.error("[SERVER] GET /api/teams/[id]/parents - Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to fetch parents", details: message },
      { status: 500 }
    )
  }
}

