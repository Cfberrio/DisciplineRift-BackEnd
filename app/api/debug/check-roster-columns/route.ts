import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[DEBUG] Checking roster columns in student table...");

    // 1. Verificar información de las columnas
    // PostgreSQL stores column names in lowercase when created without quotes
    const { data: columns, error: columnsError } = await supabase
      .from("student")
      .select("studentdismisall, teacher, medcondition")
      .limit(1);

    if (columnsError) {
      console.error("[DEBUG] Error checking columns:", columnsError);
      return NextResponse.json({
        status: "error",
        message: "Error verificando columnas",
        error: columnsError.message,
        details: columnsError,
        solution:
          "Las columnas probablemente no existen. Ejecuta la migración 003_add_student_roster_fields.sql",
      });
    }

    // 2. Contar registros con datos
    const { data: allStudents, error: studentsError } = await supabase
      .from("student")
      .select("studentid, firstname, lastname, studentdismisall, teacher, medcondition");

    if (studentsError) {
      console.error("[DEBUG] Error fetching students:", studentsError);
      return NextResponse.json({
        status: "error",
        message: "Error obteniendo estudiantes",
        error: studentsError.message,
      });
    }

    // Analizar los datos
    const totalStudents = allStudents?.length || 0;
    const withDismissal = allStudents?.filter((s) => s.studentdismisall)?.length || 0;
    const withTeacher = allStudents?.filter((s) => s.teacher)?.length || 0;
    const withMedCondition = allStudents?.filter((s) => s.medcondition)?.length || 0;

    // 3. Obtener algunos ejemplos
    const { data: sampleStudents, error: sampleError } = await supabase
      .from("student")
      .select("studentid, firstname, lastname, studentdismisall, teacher, medcondition")
      .limit(10);

    const analysis = {
      columnsExist: true,
      totalStudents,
      statistics: {
        withDismissal,
        withTeacher,
        withMedCondition,
        missingDismissal: totalStudents - withDismissal,
        missingTeacher: totalStudents - withTeacher,
        missingMedCondition: totalStudents - withMedCondition,
      },
      percentages: {
        dismissalFilled: totalStudents > 0 ? ((withDismissal / totalStudents) * 100).toFixed(2) : 0,
        teacherFilled: totalStudents > 0 ? ((withTeacher / totalStudents) * 100).toFixed(2) : 0,
        medConditionFilled:
          totalStudents > 0 ? ((withMedCondition / totalStudents) * 100).toFixed(2) : 0,
      },
      sampleData: sampleStudents || [],
    };

    console.log("[DEBUG] Roster columns analysis:", analysis);

    // Determinar el problema
    let diagnosis = "";
    let solution = "";

    if (totalStudents === 0) {
      diagnosis = "No hay estudiantes en la base de datos";
      solution = "Agrega estudiantes a la tabla student";
    } else if (withDismissal === 0 && withTeacher === 0 && withMedCondition === 0) {
      diagnosis =
        "Las columnas existen pero NO tienen datos. Todos los valores están vacíos (NULL o '')";
      solution =
        "Necesitas actualizar los registros de estudiantes con la información real. Las columnas están vacías.";
    } else if (
      withDismissal < totalStudents * 0.5 &&
      withTeacher < totalStudents * 0.5 &&
      withMedCondition < totalStudents * 0.5
    ) {
      diagnosis =
        "Las columnas existen y algunos registros tienen datos, pero la mayoría están vacíos";
      solution = "Actualiza los registros faltantes con la información real de cada estudiante";
    } else {
      diagnosis = "Las columnas existen y tienen datos";
      solution = "Todo está bien configurado";
    }

    return NextResponse.json({
      status: "success",
      diagnosis,
      solution,
      analysis,
      message: "Diagnóstico completado",
    });
  } catch (error: any) {
    console.error("[DEBUG] Unexpected error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Error inesperado",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

