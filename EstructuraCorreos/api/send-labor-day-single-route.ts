import { NextResponse } from "next/server"
import { sendLaborDayPromoEmail } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email address is required"
      }, { status: 400 })
    }

    console.log(`📧 Sending Labor Day promotional email to: ${email}`)
    
    const result = await sendLaborDayPromoEmail(email)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Labor Day promotional email sent successfully to ${email}`,
        messageId: result.messageId
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Failed to send Labor Day promotional email",
        error: result.error
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error("❌ Error sending Labor Day email:", error)
    return NextResponse.json({
      success: false,
      message: "Error sending Labor Day promotional email",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}






















