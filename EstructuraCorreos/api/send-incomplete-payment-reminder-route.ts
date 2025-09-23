import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendIncompletePaymentReminderEmail } from "@/lib/email-service";

// Función para crear cliente Supabase de forma segura
function createSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing required Supabase environment variables");
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export async function GET() {
  try {
    console.log("🔄 Fetching incomplete payment enrollments...");

    const supabaseAdmin = createSupabaseAdmin();

    // Get enrollments where isactive = false (completed registration but no payment)
    const { data: incompleteEnrollments, error: enrollmentError } = await supabaseAdmin
      .from("enrollment")
      .select(`
        enrollmentid,
        created_at,
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
          description,
          price,
          school:schoolid (
            name,
            location
          )
        )
      `)
      .eq("isactive", false)
      .order("created_at", { ascending: false });

    if (enrollmentError) {
      console.error("❌ Error fetching incomplete enrollments:", enrollmentError);
      throw new Error(`Database query failed: ${enrollmentError.message}`);
    }

    if (!incompleteEnrollments || incompleteEnrollments.length === 0) {
      console.log("ℹ️ No incomplete payment enrollments found");
      return NextResponse.json({
        message: "No incomplete payment enrollments found",
        count: 0,
        data: []
      });
    }

    // Filter out enrollments without parent email
    const validEnrollments = incompleteEnrollments.filter(enrollment => 
      enrollment.student?.parent?.email
    );

    console.log(`✅ Found ${validEnrollments.length} incomplete payment enrollments with valid parent emails`);

    // Group by parent email to avoid sending multiple emails to the same parent
    const parentEmailMap = new Map();
    validEnrollments.forEach(enrollment => {
      const parentEmail = enrollment.student.parent.email;
      if (!parentEmailMap.has(parentEmail)) {
        parentEmailMap.set(parentEmail, {
          parent: enrollment.student.parent,
          enrollments: []
        });
      }
      parentEmailMap.get(parentEmail).enrollments.push(enrollment);
    });

    const parentData = Array.from(parentEmailMap.values());

    return NextResponse.json({
      message: `Found ${parentData.length} parents with incomplete payments`,
      count: parentData.length,
      totalEnrollments: validEnrollments.length,
      data: parentData.map(parent => ({
        parentEmail: parent.parent.email,
        parentName: `${parent.parent.firstname} ${parent.parent.lastname}`,
        enrollmentCount: parent.enrollments.length,
        enrollments: parent.enrollments.map(e => ({
          enrollmentId: e.enrollmentid,
          studentName: `${e.student.firstname} ${e.student.lastname}`,
          teamName: e.team.name,
          schoolName: e.team.school.name,
          price: e.team.price,
          registrationDate: e.created_at
        }))
      }))
    });

  } catch (error) {
    console.error("❌ Error in incomplete payment reminder endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to fetch incomplete payment enrollments",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    console.log("🔄 Starting incomplete payment reminder email campaign...");

    const supabaseAdmin = createSupabaseAdmin();

    // Get incomplete enrollments (same query as GET)
    const { data: incompleteEnrollments, error: enrollmentError } = await supabaseAdmin
      .from("enrollment")
      .select(`
        enrollmentid,
        created_at,
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
          description,
          price,
          school:schoolid (
            name,
            location
          )
        )
      `)
      .eq("isactive", false)
      .order("created_at", { ascending: false });

    if (enrollmentError) {
      console.error("❌ Error fetching incomplete enrollments:", enrollmentError);
      throw new Error(`Database query failed: ${enrollmentError.message}`);
    }

    if (!incompleteEnrollments || incompleteEnrollments.length === 0) {
      return NextResponse.json({
        message: "No incomplete payment enrollments found",
        emailsSent: 0,
        errors: 0
      });
    }

    // Filter and group by parent email
    const validEnrollments = incompleteEnrollments.filter(enrollment => 
      enrollment.student?.parent?.email
    );

    const parentEmailMap = new Map();
    validEnrollments.forEach(enrollment => {
      const parentEmail = enrollment.student.parent.email;
      if (!parentEmailMap.has(parentEmail)) {
        parentEmailMap.set(parentEmail, {
          parent: enrollment.student.parent,
          enrollments: []
        });
      }
      parentEmailMap.get(parentEmail).enrollments.push(enrollment);
    });

    const parentData = Array.from(parentEmailMap.values());
    let emailsSent = 0;
    let errors = 0;
    const results = [];

    console.log(`📧 Sending emails to ${parentData.length} parents...`);

    // Send emails to each parent
    for (const parentInfo of parentData) {
      try {
        const emailResult = await sendIncompletePaymentReminderEmail(
          parentInfo.parent.email,
          parentInfo.parent.firstname,
          parentInfo.enrollments
        );

        if (emailResult.success) {
          emailsSent++;
          console.log(`✅ Email sent to ${parentInfo.parent.email}`);
          results.push({
            email: parentInfo.parent.email,
            success: true,
            messageId: emailResult.messageId
          });
        } else {
          errors++;
          console.error(`❌ Failed to send email to ${parentInfo.parent.email}:`, emailResult.error);
          results.push({
            email: parentInfo.parent.email,
            success: false,
            error: emailResult.error
          });
        }

        // Add a small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        errors++;
        console.error(`❌ Error sending email to ${parentInfo.parent.email}:`, error);
        results.push({
          email: parentInfo.parent.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    console.log(`📊 Campaign completed: ${emailsSent} sent, ${errors} errors`);

    return NextResponse.json({
      message: `Incomplete payment reminder campaign completed`,
      emailsSent,
      errors,
      totalParents: parentData.length,
      results
    });

  } catch (error) {
    console.error("❌ Error in incomplete payment reminder campaign:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to send incomplete payment reminder emails",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
