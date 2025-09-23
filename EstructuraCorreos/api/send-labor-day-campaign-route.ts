import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { sendLaborDayPromoEmail } from "@/lib/email-service"

export async function POST(request: Request) {
  try {
    console.log("🎉 === LABOR DAY EMAIL CAMPAIGN STARTED ===")

    // Verificar que las credenciales de Gmail estén configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log("❌ Gmail credentials not configured")
      return NextResponse.json({
        success: false,
        message: "Gmail credentials not configured"
      }, { status: 503 })
    }

    console.log("✅ Gmail credentials configured")

    // Obtener todos los emails de la tabla newsletter
    console.log("🔍 Fetching newsletter subscribers...")
    
    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from('newsletter')
      .select('email')

    if (subscribersError) {
      console.error("❌ Error fetching newsletter subscribers:", subscribersError)
      return NextResponse.json({
        success: false,
        message: "Failed to fetch newsletter subscribers",
        error: subscribersError.message
      }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("⚠️ No newsletter subscribers found")
      return NextResponse.json({
        success: true,
        message: "No newsletter subscribers found",
        emailsSent: 0
      })
    }

    console.log(`📬 Found ${subscribers.length} newsletter subscribers`)

    // Enviar correos a todos los suscriptores
    const emailResults = {
      sent: [] as string[],
      failed: [] as { email: string; error: string }[]
    }

    for (const subscriber of subscribers) {
      try {
        console.log(`📧 Sending email to: ${subscriber.email}`)
        const result = await sendLaborDayPromoEmail(subscriber.email)
        
        if (result.success) {
          emailResults.sent.push(subscriber.email)
          console.log(`✅ Email sent successfully to: ${subscriber.email}`)
        } else {
          emailResults.failed.push({
            email: subscriber.email,
            error: result.error || "Unknown error"
          })
        }
        
        // Pequeña pausa entre emails para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (error) {
        console.error(`❌ Failed to send email to ${subscriber.email}:`, error)
        emailResults.failed.push({
          email: subscriber.email,
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    console.log(`✅ Labor Day email campaign completed:`)
    console.log(`- Emails sent: ${emailResults.sent.length}`)
    console.log(`- Emails failed: ${emailResults.failed.length}`)

    return NextResponse.json({
      success: true,
      message: "Labor Day email campaign completed",
      totalSubscribers: subscribers.length,
      emailsSent: emailResults.sent.length,
      emailsFailed: emailResults.failed.length,
      results: emailResults
    })

  } catch (error) {
    console.error("❌ Labor Day email campaign error:", error)
    return NextResponse.json({
      success: false,
      message: "Labor Day email campaign failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log("📋 Getting Labor Day email campaign info...")

    // Contar suscriptores
    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from('newsletter')
      .select('email', { count: 'exact' })

    if (subscribersError) {
      return NextResponse.json({
        success: false,
        message: "Failed to fetch newsletter subscribers count",
        error: subscribersError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Labor Day email campaign info",
      totalSubscribers: subscribers?.length || 0,
      emailTemplate: "Labor Day promotional email ready",
      gmailConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
    })

  } catch (error) {
    console.error("❌ Error getting campaign info:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to get campaign info",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}






















