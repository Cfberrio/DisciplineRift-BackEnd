import { NextResponse } from "next/server";
import { 
  getStudentsForCancellationEmails, 
  sendCancellationEmail, 
  checkCancellationEmailConfig,
  type StudentForCancellation 
} from "@/lib/cancellation-email-service";

export async function GET(request: Request) {
  try {
    console.log('🔍 Obteniendo lista de estudiantes para emails de cancelación...');
    
    // Verificar configuración
    const config = await checkCancellationEmailConfig();
    if (!config.isValid) {
      return NextResponse.json({
        success: false,
        message: "Configuration errors found",
        errors: config.errors
      }, { status: 500 });
    }

    // Obtener estudiantes que necesitan emails de cancelación
    const students = await getStudentsForCancellationEmails();
    
    return NextResponse.json({
      success: true,
      message: `Found ${students.length} students for cancellation emails`,
      students: students.map(student => ({
        studentName: `${student.studentFirstName} ${student.studentLastName}`,
        parentName: `${student.parentFirstName} ${student.parentLastName}`,
        parentEmail: student.parentEmail,
        parentPhone: student.parentPhone,
        teamName: student.teamName,
        schoolName: student.schoolName
      })),
      count: students.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo lista de estudiantes:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to get students list",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { preview = false, testEmail = null, limit = null, specificTeam = null } = await request.json();
    
    console.log('🚀 === INICIANDO ENVÍO DE EMAILS DE CANCELACIÓN ===');
    console.log(`📋 Modo: ${preview ? 'PREVIEW' : 'ENVÍO REAL'}`);
    if (testEmail) console.log(`📧 Email de prueba: ${testEmail}`);
    if (limit) console.log(`📊 Límite: ${limit} emails`);
    if (specificTeam) console.log(`🎯 Filtrar por equipo: ${specificTeam}`);

    // Verificar configuración
    const config = await checkCancellationEmailConfig();
    if (!config.isValid) {
      return NextResponse.json({
        success: false,
        message: "Configuration errors found",
        errors: config.errors
      }, { status: 500 });
    }

    // Obtener estudiantes que necesitan emails de cancelación
    const allStudents = await getStudentsForCancellationEmails();
    
    if (allStudents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No students found for cancellation emails",
        emailsSent: 0,
        errors: 0
      });
    }

    // Filtrar por equipo específico si se especifica
    let filteredStudents = allStudents;
    if (specificTeam) {
      filteredStudents = allStudents.filter(student => 
        student.teamName.toLowerCase().includes(specificTeam.toLowerCase())
      );
      console.log(`🎯 Filtrados ${filteredStudents.length} estudiantes del equipo "${specificTeam}"`);
    }

    // Aplicar límite si se especifica
    const students = limit ? filteredStudents.slice(0, limit) : filteredStudents;

    // Deduplicar por email de padre para evitar envíos duplicados
    const uniqueStudentsByParent = new Map<string, StudentForCancellation>();
    students.forEach(student => {
      if (!uniqueStudentsByParent.has(student.parentEmail)) {
        uniqueStudentsByParent.set(student.parentEmail, student);
      }
    });

    const uniqueStudents = Array.from(uniqueStudentsByParent.values());
    console.log(`👥 Total estudiantes encontrados: ${allStudents.length}`);
    console.log(`📧 Emails únicos a enviar: ${uniqueStudents.length}`);

    // Si es preview, solo devolver la información sin enviar
    if (preview) {
      return NextResponse.json({
        success: true,
        message: "Preview mode - no emails sent",
        preview: true,
        students: uniqueStudents.map(student => ({
          studentName: `${student.studentFirstName} ${student.studentLastName}`,
          parentName: `${student.parentFirstName} ${student.parentLastName}`,
          parentEmail: student.parentEmail,
          parentPhone: student.parentPhone,
          teamName: student.teamName,
          schoolName: student.schoolName
        })),
        count: uniqueStudents.length,
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
      teamName: string;
      success: boolean;
      error?: string;
      messageId?: string;
    }> = [];

    for (const student of uniqueStudents) {
      try {
        const emailData = {
          parentName: student.parentFirstName,
          studentName: `${student.studentFirstName} ${student.studentLastName}`,
          teamName: student.teamName,
          schoolName: student.schoolName,
          parentEmail: testEmail || student.parentEmail // Usar testEmail si se proporciona
        };

        console.log(`\n📧 Procesando estudiante:`);
        console.log(`  - Estudiante: ${emailData.studentName}`);
        console.log(`  - Padre: ${emailData.parentName}`);
        console.log(`  - Equipo: ${emailData.teamName}`);
        console.log(`  - Escuela: ${emailData.schoolName}`);
        console.log(`  - Email destino: ${emailData.parentEmail}`);

        console.log(`\n📧 Enviando email a ${emailData.parentEmail} para ${emailData.teamName}...`);
        
        const result = await sendCancellationEmail(emailData);
        
        results.push({
          parentEmail: emailData.parentEmail,
          parentName: emailData.parentName,
          teamName: emailData.teamName,
          success: result.success,
          error: result.error,
          messageId: result.messageId
        });

        if (result.success) {
          emailsSent++;
          console.log(`✅ Email enviado exitosamente a ${emailData.parentEmail}`);
        } else {
          errors++;
          console.error(`❌ Error enviando email a ${emailData.parentEmail}: ${result.error}`);
        }

        // Pequeña pausa entre emails para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errors++;
        console.error(`❌ Error procesando estudiante ${student.studentFirstName} ${student.studentLastName}:`, error);
        
        results.push({
          parentEmail: student.parentEmail,
          parentName: student.parentFirstName,
          teamName: student.teamName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Resumen final
    console.log('\n📊 === RESUMEN DEL ENVÍO ===');
    console.log(`📧 Emails enviados: ${emailsSent}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📋 Total procesados: ${uniqueStudents.length}`);
    console.log('✅ Proceso completado');

    return NextResponse.json({
      success: true,
      message: `Cancellation emails process completed`,
      emailsSent,
      errors,
      totalProcessed: uniqueStudents.length,
      results: results.map(r => ({
        parentEmail: r.parentEmail,
        parentName: r.parentName,
        teamName: r.teamName,
        success: r.success,
        error: r.error
      }))
    });

  } catch (error) {
    console.error('💥 Error fatal en el envío de emails de cancelación:', error);
    return NextResponse.json({
      success: false,
      message: "Fatal error sending cancellation emails",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
