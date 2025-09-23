import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import nodemailer from 'nodemailer';

// Create Gmail transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// Interface for parent data
interface ParentData {
  email: string;
  firstName: string;
}

export async function GET(request: Request) {
  try {
    console.log('🔍 Getting qualified parents for Fall Season email...');
    
    // Verificar configuración de Gmail
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({
        success: false,
        message: "Gmail credentials not configured"
      }, { status: 500 });
    }

    const qualifiedParents = await getQualifiedParents();
    
    return NextResponse.json({
      success: true,
      message: `Found ${qualifiedParents.length} qualified parents`,
      parents: qualifiedParents,
      count: qualifiedParents.length
    });

  } catch (error) {
    console.error('❌ Error getting qualified parents:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to get qualified parents",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { preview = false, testEmail = null, limit = null } = await request.json();
    
    console.log('🚀 === STARTING FALL SEASON EMAIL CAMPAIGN ===');
    console.log(`📋 Mode: ${preview ? 'PREVIEW' : 'REAL SEND'}`);
    if (testEmail) console.log(`📧 Test email: ${testEmail}`);
    if (limit) console.log(`📊 Limit: ${limit} emails`);

    // Verificar configuración de Gmail
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log("❌ Gmail credentials not configured");
      return NextResponse.json({
        success: false,
        message: "Gmail credentials not configured"
      }, { status: 503 });
    }

    console.log("✅ Gmail credentials configured");

    // Obtener padres calificados
    const allQualifiedParents = await getQualifiedParents();
    
    if (allQualifiedParents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No qualified parents found for Fall Season email",
        emailsSent: 0,
        errors: 0
      });
    }

    // Aplicar límite si se especifica
    const qualifiedParents = limit ? allQualifiedParents.slice(0, limit) : allQualifiedParents;

    console.log(`👥 Total qualified parents found: ${allQualifiedParents.length}`);
    console.log(`📧 Emails to send: ${qualifiedParents.length}`);

    // Si es preview, solo devolver la información sin enviar
    if (preview) {
      return NextResponse.json({
        success: true,
        message: "Preview mode - no emails sent",
        preview: true,
        parents: qualifiedParents,
        count: qualifiedParents.length,
        emailsSent: 0,
        errors: 0
      });
    }

    // Enviar emails reales
    let emailsSent = 0;
    let errors = 0;
    const results: Array<{
      parentEmail: string;
      parentName: string;
      success: boolean;
      error?: string;
      messageId?: string;
    }> = [];

    const transporter = createTransporter();

    for (const parent of qualifiedParents) {
      try {
        console.log(`\n📧 Sending email to ${parent.email} (${parent.firstName})...`);
        
        const result = await sendFallSeasonEmail(transporter, {
          parentEmail: testEmail || parent.email,
          parentName: parent.firstName
        });
        
        results.push({
          parentEmail: parent.email,
          parentName: parent.firstName,
          success: result.success,
          error: result.error,
          messageId: result.messageId
        });

        if (result.success) {
          emailsSent++;
          console.log(`✅ Email sent successfully to ${parent.email}`);
        } else {
          errors++;
          console.error(`❌ Error sending email to ${parent.email}: ${result.error}`);
        }

        // Pequeña pausa entre emails para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errors++;
        console.error(`❌ Error processing parent ${parent.firstName} (${parent.email}):`, error);
        
        results.push({
          parentEmail: parent.email,
          parentName: parent.firstName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Resumen final
    console.log('\n📊 === SENDING SUMMARY ===');
    console.log(`📧 Emails sent: ${emailsSent}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📋 Total processed: ${qualifiedParents.length}`);
    console.log('✅ Process completed');

    return NextResponse.json({
      success: true,
      message: `Fall Season email campaign completed`,
      emailsSent,
      errors,
      totalProcessed: qualifiedParents.length,
      results: results.map(r => ({
        parentEmail: r.parentEmail,
        parentName: r.parentName,
        success: r.success,
        error: r.error
      }))
    });

  } catch (error) {
    console.error('💥 Fatal error in Fall Season email campaign:', error);
    return NextResponse.json({
      success: false,
      message: "Fatal error sending Fall Season emails",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Función para obtener padres calificados según las condiciones específicas
async function getQualifiedParents(): Promise<ParentData[]> {
  try {
    console.log('🔍 Searching for qualified parents...');
    console.log('📋 Condiciones a cumplir:');
    console.log('   1. Email debe estar en tabla Newsletter');
    console.log('   2. Debe tener Enrollment con isactive = false');
    console.log('   3. Debe tener Team con isactive = true');
    
    // CONDICIÓN 1: Obtener todos los emails de la tabla Newsletter
    console.log('\n🔍 Paso 1: Verificando tabla Newsletter...');
    const { data: newsletterEmails, error: newsletterError } = await supabaseAdmin
      .from('Newsletter')
      .select('email');

    if (newsletterError) {
      console.error('❌ Error fetching newsletter emails:', newsletterError);
      throw new Error(`Newsletter query failed: ${newsletterError.message}`);
    }

    if (!newsletterEmails || newsletterEmails.length === 0) {
      console.log('⚠️ No newsletter subscribers found');
      return [];
    }

    console.log(`✅ Found ${newsletterEmails.length} newsletter subscribers`);
    const newsletterEmailSet = new Set(newsletterEmails.map(n => n.email?.toLowerCase()).filter(Boolean));

    // CONDICIÓN 2 y 3: Buscar padres con enrollments inactivos Y teams activos
    console.log('\n🔍 Paso 2: Verificando Enrollments con isactive = false...');
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollment')
      .select(`
        enrollmentid,
        isactive,
        studentid,
        teamid,
        student:studentid (
          studentid,
          firstname,
          lastname,
          parent:parentid (
            parentid,
            firstname,
            lastname,
            email
          )
        ),
        team:teamid (
          teamid,
          name,
          isactive
        )
      `)
      .eq('isactive', false); // CONDICIÓN 2: Enrollment inactivo

    if (enrollmentError) {
      console.error('❌ Error fetching enrollments:', enrollmentError);
      throw new Error(`Enrollment query failed: ${enrollmentError.message}`);
    }

    if (!enrollments || enrollments.length === 0) {
      console.log('⚠️ No inactive enrollments found');
      return [];
    }

    console.log(`✅ Found ${enrollments.length} enrollments with isactive = false`);

    // Filtrar enrollments que tienen teams activos (CONDICIÓN 3)
    const enrollmentsWithActiveTeams = enrollments.filter(enrollment => {
      const hasActiveTeam = enrollment.team?.isactive === true;
      if (!hasActiveTeam) {
        console.log(`❌ Enrollment ${enrollment.enrollmentid}: Team "${enrollment.team?.name}" is not active`);
      }
      return hasActiveTeam;
    });

    console.log(`✅ Found ${enrollmentsWithActiveTeams.length} enrollments with active teams`);

    // PASO 3: Combinar todas las condiciones
    console.log('\n🔍 Paso 3: Combinando todas las condiciones...');
    const qualifiedParents: ParentData[] = [];
    const processedEmails = new Set<string>();

    for (const enrollment of enrollmentsWithActiveTeams) {
      try {
        const student = enrollment.student;
        const team = enrollment.team;
        const parent = student?.parent;

        // Verificar que el padre exista y tenga email
        if (!parent?.email) {
          console.log(`❌ Enrollment ${enrollment.enrollmentid}: No parent email found`);
          continue;
        }

        const parentEmailLower = parent.email.toLowerCase();

        // CONDICIÓN 1: Verificar que el email esté en Newsletter
        if (!newsletterEmailSet.has(parentEmailLower)) {
          console.log(`❌ ${parent.email}: Not in Newsletter table`);
          continue;
        }

        // Evitar duplicados
        if (processedEmails.has(parentEmailLower)) {
          console.log(`⚠️ ${parent.email}: Already processed (duplicate)`);
          continue;
        }

        // ✅ TODAS LAS CONDICIONES CUMPLIDAS
        qualifiedParents.push({
          email: parent.email,
          firstName: parent.firstname || 'Parent'
        });

        processedEmails.add(parentEmailLower);

        console.log(`✅ QUALIFIED: ${parent.firstname} ${parent.lastname} (${parent.email})`);
        console.log(`   - Team: ${team.name} (active: ${team.isactive})`);
        console.log(`   - Enrollment: ${enrollment.enrollmentid} (active: ${enrollment.isactive})`);
        console.log(`   - In Newsletter: ✅`);

      } catch (itemError) {
        console.warn(`⚠️ Error processing enrollment ${enrollment.enrollmentid}:`, itemError);
        continue;
      }
    }

    console.log(`\n🎯 RESUMEN FINAL:`);
    console.log(`   - Newsletter subscribers: ${newsletterEmails.length}`);
    console.log(`   - Enrollments (isactive=false): ${enrollments.length}`);
    console.log(`   - Enrollments with active teams: ${enrollmentsWithActiveTeams.length}`);
    console.log(`   - QUALIFIED PARENTS: ${qualifiedParents.length}`);

    return qualifiedParents;

  } catch (error) {
    console.error('❌ Error in getQualifiedParents:', error);
    throw error;
  }
}

// Función para enviar el email específico de Fall Season
async function sendFallSeasonEmail(transporter: any, data: {
  parentEmail: string;
  parentName: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const htmlContent = `<!doctype html>
<html lang="en" style="margin:0; padding:0;">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>Email</title>
  <style>
    /* Layout */
    body{margin:0; padding:0; background:#f3f4f6; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;}
    table{border-collapse:collapse;}
    .container{width:600px; max-width:600px; margin:0 auto;}
    .card{background:#ffffff; border:1px solid #e5e7eb; border-radius:14px; padding:24px; box-shadow:0 12px 32px rgba(17,24,39,.08);}

    /* Typography */
    .text{font:400 15px/1.6 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#374151; letter-spacing:.1px;}
    .lead{color:#111827; font-weight:600;}
    .section-title{font:700 16px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111827; margin:16px 0 8px; padding-bottom:6px; border-bottom:1px solid #e5e7eb;}
    ul{margin:8px 0 16px 22px; padding:0;}
    li{margin:0 0 8px 0;}
    a{color:#2563eb; text-decoration:underline; text-underline-offset:2px;}
    a:hover{opacity:.95;}

    /* Mobile */
    @media (max-width:600px){
      .container{width:100% !important;}
      .card{border-radius:12px; padding:16px; box-shadow:0 8px 24px rgba(17,24,39,.12);} 
      .text{font-size:15px;}
    }

    /* Dark mode */
    @media (prefers-color-scheme: dark){
      body, table, td{background:#0b0b0d !important; color:#f2f2f3 !important;}
      .card{background:#16161a !important; border-color:#2a2a31 !important;}
      .text{color:#e5e7eb !important;}
      .section-title{border-bottom-color:#2a2a31 !important;}
      a{color:#9dc1ff !important;}
    }

    /* Print */
    @media print{ body{background:#fff;} .card{box-shadow:none; border-color:#d1d5db;} }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0">
          <tr>
            <td class="card">

              <p class="text">Hi ${data.parentName},</p>

              <p class="text lead">We're just 3 days from the start of the Discipline Rift Fall Season, and we noticed you haven't registered yet 😤</p>

              <p class="text">🏐 Volleyball  🎾 Tennis 🥒 Pickleball</p>

              <p class="text">If your player is planning to join us, please register ASAP to secure a spot:</p>

              <p class="text">👉 Register here: <a href="https://www.disciplinerift.com/#register">https://www.disciplinerift.com/#register</a></p>

              <p class="section-title">Quick details:</p>
              <ul class="text">
                <li>Who: K–5 (12U)</li>
                <li>Length: 6 weeks | 1 practice per week after school</li>
                <li>Price: $129 per student, per season</li>
                <li>Equipment: We bring everything (knee pads recommended for volleyball)</li>
                <li>Confirmation: You'll get an email with your exact dates/times right after checkout</li>
              </ul>

              <p class="section-title">Can't find your school or the team is full?</p>
              <ul class="text">
                <li>Join the waitlist/newsletter on the main site popup for openings, or reply for help.</li>
              </ul>

              <p class="section-title">Need help registering?</p>
              <p class="text">We'll guide you through next steps (subject to availability).</p>

              <p class="text">Let's kick off an awesome season together!</p>

              <p class="text">Warmly,<br/>The Discipline Rift Team</p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: {
        name: 'Discipline Rift',
        address: process.env.GMAIL_USER!,
      },
      to: data.parentEmail,
      subject: '🏐 Just 3 days left to register for Fall Season!',
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Error sending Fall Season email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
