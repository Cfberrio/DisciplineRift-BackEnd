import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendIncompletePaymentReminderEmail } from "@/lib/email-service";

export async function GET() {
  try {
    console.log("🔄 Buscando enrollments con isactive = false...");

    // Crear cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener enrollments con isactive = false
    const { data: enrollments, error } = await supabase
      .from('enrollment')
      .select(`
        enrollmentid,
        isactive,
        student:studentid (
          firstname,
          lastname,
          parent:parentid (
            firstname,
            lastname,
            email
          )
        ),
        team:teamid (
          name,
          school:schoolid (
            name
          )
        )
      `)
      .eq('isactive', false);

    if (error) {
      console.error("❌ Error de Supabase:", error);
      return NextResponse.json({
        error: "Error consultando base de datos",
        details: error.message
      }, { status: 500 });
    }

    console.log(`📊 Encontrados ${enrollments?.length || 0} enrollments con isactive = false`);

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        message: "No hay enrollments con pagos incompletos",
        count: 0
      });
    }

    // Filtrar solo enrollments con email válido
    const validEnrollments = enrollments.filter(e => 
      e.student?.parent?.email
    );

    console.log(`✅ Enrollments válidos: ${validEnrollments.length}`);

    // Agrupar por email del padre
    const parentMap = new Map();
    validEnrollments.forEach(enrollment => {
      const email = enrollment.student.parent.email;
      if (!parentMap.has(email)) {
        parentMap.set(email, {
          email,
          name: enrollment.student.parent.firstname,
          enrollments: []
        });
      }
      parentMap.get(email).enrollments.push(enrollment);
    });

    const parents = Array.from(parentMap.values());

    return NextResponse.json({
      message: `Encontrados ${parents.length} padres con pagos incompletos`,
      count: parents.length,
      parents: parents.map(parent => ({
        email: parent.email,
        name: parent.name,
        enrollmentCount: parent.enrollments.length
      }))
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log("🚀 INICIANDO ENVÍO MASIVO DE CORREOS");

    // Crear cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener enrollments con isactive = false
    const { data: enrollments, error } = await supabase
      .from('enrollment')
      .select(`
        enrollmentid,
        isactive,
        student:studentid (
          firstname,
          lastname,
          parent:parentid (
            firstname,
            lastname,
            email
          )
        ),
        team:teamid (
          name,
          school:schoolid (
            name
          )
        )
      `)
      .eq('isactive', false);

    if (error) {
      console.error("❌ Error de Supabase:", error);
      return NextResponse.json({
        error: "Error consultando base de datos",
        details: error.message
      }, { status: 500 });
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        message: "No hay enrollments con pagos incompletos",
        emailsSent: 0
      });
    }

    // Filtrar y agrupar
    const validEnrollments = enrollments.filter(e => 
      e.student?.parent?.email
    );

    const parentMap = new Map();
    validEnrollments.forEach(enrollment => {
      const email = enrollment.student.parent.email;
      if (!parentMap.has(email)) {
        parentMap.set(email, {
          email,
          name: enrollment.student.parent.firstname,
          enrollments: []
        });
      }
      parentMap.get(email).enrollments.push(enrollment);
    });

    const parents = Array.from(parentMap.values());
    console.log(`👥 Enviando correos a ${parents.length} padres`);

    let emailsSent = 0;
    let emailsFailed = 0;
    const results = [];

    // Enviar correos
    for (const parent of parents) {
      try {
        console.log(`📧 Enviando a ${parent.email}...`);

        const result = await sendIncompletePaymentReminderEmail(
          parent.email,
          parent.name,
          parent.enrollments
        );

        if (result.success) {
          console.log(`✅ Enviado a ${parent.email} - ID: ${result.messageId}`);
          emailsSent++;
          results.push({
            email: parent.email,
            success: true,
            messageId: result.messageId
          });
        } else {
          console.error(`❌ Error enviando a ${parent.email}:`, result.error);
          emailsFailed++;
          results.push({
            email: parent.email,
            success: false,
            error: result.error
          });
        }

        // Delay entre correos
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Error crítico enviando a ${parent.email}:`, error);
        emailsFailed++;
        results.push({
          email: parent.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    console.log(`📊 Completado: ${emailsSent} enviados, ${emailsFailed} fallos`);

    return NextResponse.json({
      message: "Campaña de correos completada",
      emailsSent,
      emailsFailed,
      totalParents: parents.length,
      results
    });

  } catch (error) {
    console.error("❌ Error crítico:", error);
    return NextResponse.json({
      error: "Error crítico en campaña de correos",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
