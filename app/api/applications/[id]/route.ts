import { NextResponse } from "next/server"
import { drteamService } from "@/lib/db/drteam-service"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 }
      )
    }

    await drteamService.deleteApplication(id)

    return NextResponse.json({ 
      success: true,
      message: "Application deleted successfully" 
    })
  } catch (error) {
    console.error("Error deleting application:", error)
    return NextResponse.json(
      { 
        error: "Failed to delete application",
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
