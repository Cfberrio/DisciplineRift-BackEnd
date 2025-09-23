import { NextRequest, NextResponse } from "next/server"
import { drteamService } from "@/lib/db/drteam-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      )
    }

    // Obtener la aplicación por ID para verificar que existe y obtener la ruta del resume
    const { createServerSupabaseClient } = await import("@/lib/supabase/server")
    const serverClient = await createServerSupabaseClient()
    
    const { data: application, error } = await serverClient
      .from("Drteam")
      .select("resume, firstName, lastName")
      .eq("id", id)
      .single()

    if (error || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    if (!application.resume) {
      return NextResponse.json(
        { error: "No resume file available for this application" },
        { status: 404 }
      )
    }

    // Generar URL pública del bucket resume
    const resumeUrl = drteamService.getResumeUrl(application.resume)
    
    if (!resumeUrl) {
      return NextResponse.json(
        { error: "Unable to generate resume URL" },
        { status: 500 }
      )
    }

    // Hacer redirect a la URL del archivo para visualización en nueva pestaña
    return NextResponse.redirect(resumeUrl, {
      status: 302,
      headers: {
        'Content-Disposition': `inline; filename="resume_${application.firstName}_${application.lastName}.pdf"`,
        'Content-Type': 'application/pdf',
      }
    })

  } catch (error) {
    console.error("Error in /api/resume:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
