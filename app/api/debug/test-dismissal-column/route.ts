import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[DEBUG DISMISSAL] Testing StudentDismisall column...");

    // 1. Probar diferentes variaciones del nombre de la columna
    const variations = [
      "StudentDismisall",
      "studentdismisall", 
      "StudentDismissal",
      "studentdismissal",
      "student_dismissal",
      "STUDENTDISMISALL"
    ];

    const results: any = {};

    for (const columnName of variations) {
      try {
        const { data, error } = await supabase
          .from("student")
          .select(`studentid, firstname, lastname, ${columnName}`)
          .limit(5);

        if (!error && data) {
          results[columnName] = {
            success: true,
            sampleData: data,
            countWithData: data.filter((s: any) => s[columnName]).length,
            columnExists: true
          };
          console.log(`[DEBUG DISMISSAL] ✅ Column "${columnName}" works!`, data);
        } else {
          results[columnName] = {
            success: false,
            error: error?.message,
            columnExists: false
          };
          console.log(`[DEBUG DISMISSAL] ❌ Column "${columnName}" failed:`, error?.message);
        }
      } catch (e: any) {
        results[columnName] = {
          success: false,
          error: e.message,
          columnExists: false
        };
      }
    }

    // 2. Obtener información de la estructura de la tabla
    const { data: allColumns, error: columnsError } = await supabase
      .from("student")
      .select("*")
      .limit(1);

    let columnNames: string[] = [];
    if (!columnsError && allColumns && allColumns.length > 0) {
      columnNames = Object.keys(allColumns[0]);
    }

    // 3. Filtrar columnas que contengan "dismiss"
    const dismissalRelatedColumns = columnNames.filter(col => 
      col.toLowerCase().includes("dismiss")
    );

    // 4. Si encontramos una columna correcta, obtener estadísticas completas
    let detailedStats = null;
    const workingColumn = Object.entries(results).find(([_, result]: [string, any]) => result.success);
    
    if (workingColumn) {
      const [columnName] = workingColumn;
      const { data: allStudents } = await supabase
        .from("student")
        .select(`studentid, firstname, lastname, ${columnName}`);

      if (allStudents) {
        const withData = allStudents.filter((s: any) => {
          const value = s[columnName];
          return value !== null && value !== undefined && value !== "";
        });

        const withNull = allStudents.filter((s: any) => {
          const value = s[columnName];
          return value === null || value === undefined;
        });

        const withEmpty = allStudents.filter((s: any) => {
          const value = s[columnName];
          return value === "";
        });

        detailedStats = {
          workingColumnName: columnName,
          total: allStudents.length,
          withData: withData.length,
          withNull: withNull.length,
          withEmptyString: withEmpty.length,
          percentageFilled: ((withData.length / allStudents.length) * 100).toFixed(2),
          sampleWithData: withData.slice(0, 10).map((s: any) => ({
            name: `${s.firstname} ${s.lastname}`,
            dismissalValue: s[columnName]
          })),
          sampleWithNull: withNull.slice(0, 5).map((s: any) => ({
            name: `${s.firstname} ${s.lastname}`,
            dismissalValue: s[columnName]
          }))
        };
      }
    }

    return NextResponse.json({
      status: "success",
      message: "Diagnóstico de columna StudentDismisall completado",
      allTableColumns: columnNames,
      dismissalRelatedColumns,
      columnVariationTests: results,
      detailedStatistics: detailedStats,
      recommendation: workingColumn 
        ? `Usa la columna "${workingColumn[0]}" en tus queries`
        : "No se encontró ninguna variación funcional de la columna"
    });
  } catch (error: any) {
    console.error("[DEBUG DISMISSAL] Unexpected error:", error);
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

