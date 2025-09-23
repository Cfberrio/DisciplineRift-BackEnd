import { NextResponse } from "next/server"
import { sendParentGuideEmail } from "@/lib/email-service"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, sportInterest } = body

    // Validar que el email sea requerido
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      )
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      )
    }

    console.log("📧 Saving newsletter subscription and sending Parent Guide email to:", email, "Sport interest:", sportInterest)

    // Guardar en la tabla Newsletter de Supabase
    try {
      const { data: newsletterData, error: newsletterError } = await supabase
        .from("Newsletter")
        .insert({
          email: email.trim(),
          sport: sportInterest || null,
        })
        .select()

      if (newsletterError) {
        console.error("❌ Error saving to Newsletter table:", newsletterError)
        
        // Verificar si es un error de duplicado (email ya existe)
        if (newsletterError.code === '23505') {
          console.log("ℹ️ Email already exists in newsletter, updating sport interest...")
          
          // Actualizar el deporte si el email ya existe
          const { error: updateError } = await supabase
            .from("Newsletter")
            .update({ sport: sportInterest || null })
            .eq("email", email.trim())

          if (updateError) {
            console.error("❌ Error updating Newsletter table:", updateError)
            // No fallamos por esto, seguimos con el envío del email
          } else {
            console.log("✅ Newsletter subscription updated successfully")
          }
        } else {
          // Para otros errores, los logueamos pero no fallamos el proceso
          console.error("❌ Newsletter save error:", newsletterError.message)
        }
      } else {
        console.log("✅ Newsletter subscription saved successfully:", newsletterData)
      }
    } catch (dbError) {
      console.error("❌ Database error when saving newsletter:", dbError)
      // No fallamos por errores de base de datos, continuamos con el email
    }

    // Enviar el email
    const result = await sendParentGuideEmail(email, sportInterest)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Newsletter subscription saved and Parent Guide email sent successfully",
        messageId: result.messageId,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send email",
          error: result.error,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("❌ Error in send-parent-guide API:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}