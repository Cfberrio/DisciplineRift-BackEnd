import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import nodemailer from 'nodemailer'

// Configurar el transportador de Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

// HTML Template para el correo promocional del Labor Day
const createLaborDayEmailTemplate = () => {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>It's Labor Day! Here's what actually matters</title>
  <style>
    /* Basic email resets */
    html, body { margin:0; padding:0; height:100%; }
    body, table, td, p { margin: 0; padding: 0; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse; }

    /* Layout helpers */
    .inner { width:600px; max-width:600px; }
    .shadow { box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
    .card { background-color:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden; }
    .px-32 { padding-left:32px; padding-right:32px; }
    .py-32 { padding-top:32px; padding-bottom:32px; }
    .badge { display:inline-block; padding:2px 8px; border-radius:9999px; background:#eef2ff; color:#1e40af; font-weight:700; font-size:13px; letter-spacing:.02em; }
    .code-badge { display:inline-block; padding:2px 8px; border-radius:8px; background:#111827; color:#ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:14px; }
    .muted { color:#6b7280; }
    .lead { color:#374151; }
    .divider { height:1px; background:#e5e7eb; line-height:1px; }
    .callout { border-left:4px solid #3b82f6; background:#f9fafb; border-radius:12px; }

    /* Responsive */
    @media (max-width: 600px) {
      .inner { width:100% !important; max-width:100% !important; }
      .px-32 { padding-left: 20px !important; padding-right: 20px !important; }
      .py-32 { padding-top: 24px !important; padding-bottom: 24px !important; }
      .h1 { font-size:24px !important; line-height:32px !important; }
    }
  </style>
</head>
<body style="background:#f6f7f9; background-image:linear-gradient(180deg,#f8fafc, #eef2ff 25%, #f6f7f9 60%); margin:0; padding:0;">
  <center role="article" aria-roledescription="email" lang="en" style="width:100%;">
    <table role="presentation" width="100%" style="width:100%;" aria-hidden="true">
      <tr>
        <td align="center" style="padding:24px;">
          <!-- Card -->
          <table role="presentation" class="inner card shadow" width="600">
            <!-- Header / Hero -->
            <tr>
              <td style="padding:28px 32px; background: linear-gradient(135deg,#0ea5e9,#3b82f6);">
                <h1 class="h1" style="font-family: Arial, Helvetica, sans-serif; font-size:28px; line-height:36px; font-weight:800; margin:0; color:#ffffff; letter-spacing:.2px;">It's Labor Day! Here's what actually matters</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="px-32 py-32" style="font-family: Arial, Helvetica, sans-serif; color:#111827;">

                <!-- Lead -->
                <p style="font-size:16px; line-height:24px; margin:0;" class="lead"><strong>What do kids value the most in sports?</strong> The friendships they make</p>

                <div style="height:16px; line-height:16px;">&nbsp;</div>
                <div class="divider" style="height:1px; background:#e5e7eb;">&nbsp;</div>
                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Did you know -->
                <p style="font-size:14px; line-height:22px; margin:0; font-weight:700;">Did you know?</p>
                <div style="height:8px; line-height:8px;">&nbsp;</div>
                <p style="font-size:16px; line-height:24px; margin:0;" class="lead">80% of players highlighted positive social interactions as the top benefit<br/>(Anderson-Butcher et al., 2022)</p>

                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Callout -->
                <table role="presentation" width="100%" style="width:100%;" class="callout">
                  <tr>
                    <td style="padding:16px;">
                      <p style="font-size:16px; line-height:24px; color:#111827; margin:0;"><strong>The WE, not ME:</strong> partner + team drills that require communication, encouragement, and shared goals.</p>
                    </td>
                  </tr>
                </table>

                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Meaningful -->
                <p style="font-size:16px; line-height:24px; margin:0;" class="lead">Social interaction with peers and coaches is what makes sports experiences meaningful</p>

                <div style="height:24px; line-height:24px;">&nbsp;</div>
                <div class="divider" style="height:1px; background:#e5e7eb;">&nbsp;</div>
                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Labor Day note -->
                <p style="font-size:16px; line-height:24px; margin:0;">Because you read this on labor day, let's celebrate your hard work</p>

                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Offer -->
                <p style="font-size:16px; line-height:28px; margin:0;" class="lead">Register by 11:59 PM, September 1st<br/>Use code: <span class="code-badge">LABORDAY</span><br/>Get a discount on this season's registration</p>

                <div style="height:16px; line-height:16px;">&nbsp;</div>

                <!-- Sports -->
                <p style="font-size:12px; line-height:20px; margin:0; text-transform:uppercase; letter-spacing:.12em;" class="muted">Tennis | Tennis | Pickleball</p>

                <div style="height:28px; line-height:28px;">&nbsp;</div>

                <!-- CTA Button (Bulletproof) -->
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left">
                  <tr>
                    <td>
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="https://www.disciplinerift.com/#register" style="height:50px;v-text-anchor:middle;width:230px;" arcsize="14%" stroke="f" fillcolor="#ef4444">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial, Helvetica, sans-serif;font-size:16px;font-weight:700;">REGISTER NOW</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <a href="https://www.disciplinerift.com/#register" target="_blank" style="display:inline-block; padding:16px 26px; font-size:16px; line-height:18px; color:#ffffff; text-decoration:none; font-weight:700; border-radius:12px; font-family: Arial, Helvetica, sans-serif; background:linear-gradient(135deg,#ef4444,#dc2626); box-shadow:0 8px 16px rgba(220,38,38,0.25);">REGISTER NOW</a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
          <!-- /Card -->

          <div style="height:24px; line-height:24px;">&nbsp;</div>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>`
}

// Función para enviar correo promocional del Labor Day
export async function sendLaborDayEmail(email: string) {
  try {
    // Verificar que las credenciales de Gmail estén configuradas
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error('Gmail credentials not configured')
    }

    const transporter = createTransporter()
    const htmlContent = createLaborDayEmailTemplate()

    const mailOptions = {
      from: `"Discipline Rift" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "🎉 Labor Day Special: Celebrate Your Hard Work with 10% Off!",
      html: htmlContent,
    }

    console.log(`📧 Sending Labor Day email to: ${email}`)
    const result = await transporter.sendMail(mailOptions)
    console.log(`✅ Labor Day email sent successfully to: ${email}`)
    return result

  } catch (error) {
    console.error(`❌ Error sending Labor Day email to ${email}:`, error)
    throw error
  }
}

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
    
    let subscribers;
    let subscribersError;
    
    try {
      const result = await supabaseAdmin
        .from('newsletter')
        .select('email')
      
      subscribers = result.data;
      subscribersError = result.error;
      
      console.log("📊 Supabase query result:", { 
        dataLength: subscribers?.length, 
        error: subscribersError?.message 
      })
      
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError)
      return NextResponse.json({
        success: false,
        message: "Database connection failed",
        error: dbError instanceof Error ? dbError.message : "Unknown database error"
      }, { status: 500 })
    }

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

    // Por ahora, solo enviamos a los primeros 3 emails para probar
    const testSubscribers = subscribers.slice(0, 3);
    console.log(`🧪 Sending test emails to first ${testSubscribers.length} subscribers`)

    // Enviar correos a los suscriptores de prueba
    const emailResults = {
      sent: [] as string[],
      failed: [] as { email: string; error: string }[]
    }

    for (const subscriber of testSubscribers) {
      try {
        console.log(`📧 Sending email to: ${subscriber.email}`)
        await sendLaborDayEmail(subscriber.email)
        emailResults.sent.push(subscriber.email)
        console.log(`✅ Email sent successfully to: ${subscriber.email}`)
        
        // Pequeña pausa entre emails para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
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
      message: "Labor Day email campaign completed (test mode)",
      totalSubscribers: subscribers.length,
      testEmailsSent: emailResults.sent.length,
      testEmailsFailed: emailResults.failed.length,
      results: emailResults
    })

  } catch (error) {
    console.error("❌ Labor Day email campaign error:", error)
    return NextResponse.json({
      success: false,
      message: "Labor Day email campaign failed",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

// Método GET para testing/preview
export async function GET() {
  try {
    console.log("📋 Getting Labor Day email campaign info...")

    return NextResponse.json({
      success: true,
      message: "Labor Day email campaign endpoint is working",
      timestamp: new Date().toISOString(),
      gmailConfigured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
      supabaseConfigured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
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
