import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendSessionReminderEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const { preview = false } = await request.json();

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log("🔍 Fetching active enrollments for September 17th sessions...");

    // Get active enrollments with related data
    const { data: enrollments, error: enrollmentError } = await supabaseAdmin
      .from('enrollment')
      .select(`
        enrollmentid,
        isactive,
        student:studentid (
          studentid,
          firstname,
          lastname,
          grade,
          ecname,
          ecphone,
          ecrelationship,
          parent:parentid (
            parentid,
            firstname,
            lastname,
            email,
            phone
          )
        ),
        team:teamid (
          teamid,
          name,
          description,
          price,
          school:schoolid (
            schoolid,
            name,
            location
          ),
          session (
            sessionid,
            startdate,
            enddate,
            starttime,
            endtime,
            daysofweek,
            staff:coachid (
              id,
              name,
              email,
              phone
            )
          )
        )
      `)
      .eq('isactive', true);

    if (enrollmentError) {
      console.error("❌ Error fetching enrollments:", enrollmentError);
      return NextResponse.json(
        { message: "Error fetching enrollments", error: enrollmentError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${enrollments?.length || 0} active enrollments`);

    // Filter for sessions that start on September 17th, 2025
    const targetDate = new Date('2025-09-17');
    const targetDateString = '2025-09-17';

    const sessionsOnDate = enrollments?.filter(enrollment => {
      const sessions = enrollment.team?.session || [];
      return sessions.some(session => {
        // Check if session starts on September 17th OR if Wednesday is in the daysofweek
        const startDate = new Date(session.startdate);
        const daysOfWeek = session.daysofweek?.toLowerCase() || '';
        
        // Check if session starts on or before Sept 17 and includes Wednesday
        const startsOnOrBeforeTarget = startDate <= targetDate;
        const includesWednesday = daysOfWeek.includes('wednesday') || daysOfWeek.includes('wed');
        
        // Or check if session starts exactly on Sept 17
        const startsOnTarget = session.startdate === targetDateString;
        
        return (startsOnOrBeforeTarget && includesWednesday) || startsOnTarget;
      });
    }) || [];

    console.log(`✅ Found ${sessionsOnDate.length} enrollments with sessions starting on/including Wednesday, September 17th`);

    if (preview) {
      // Return preview of email templates
      const previews = sessionsOnDate.slice(0, 3).map(enrollment => {
        const student = enrollment.student;
        const parent = student?.parent;
        const team = enrollment.team;
        const session = team?.session?.[0]; // Take first session for preview
        const school = team?.school;

        if (!parent || !student || !team || !session) {
          return null;
        }

        // Format session date and time
        const sessionDate = new Date('2025-09-17').toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const sessionTime = `${session.starttime} - ${session.endtime}`;

        return {
          to: parent.email,
          subject: `🏐 Reminder: ${student.firstname}'s session in 30 days`,
          parentName: `${parent.firstname} ${parent.lastname}`,
          studentName: `${student.firstname} ${student.lastname}`,
          teamName: team.name,
          schoolName: school?.name || 'TBD',
          sessionDate: sessionDate,
          sessionTime: sessionTime,
          schoolLocation: school?.location || 'TBD',
          reminderType: '30d' // 30-day reminder for sessions starting September 17th 2025
        };
      }).filter(Boolean);

      return NextResponse.json({
        message: "Preview of September 17th session reminder emails",
        count: previews.length,
        totalFound: sessionsOnDate.length,
        previews: previews
      });
    }

    // If not preview, send actual emails
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { message: "Gmail SMTP credentials not configured" },
        { status: 500 }
      );
    }

    let sentCount = 0;
    let errorCount = 0;
    const results = [];

    for (const enrollment of sessionsOnDate) {
      const student = enrollment.student;
      const parent = student?.parent;
      const team = enrollment.team;
      const session = team?.session?.[0]; // Take first session
      const school = team?.school;

      if (!parent?.email || !student || !team || !session) {
        console.warn(`⚠️ Skipping enrollment ${enrollment.enrollmentid} - missing data`);
        continue;
      }

      try {
        // Format session date and time
        const sessionDate = new Date('2025-09-17').toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const sessionTime = `${session.starttime} - ${session.endtime}`;

        const emailResult = await sendSessionReminderEmail({
          parentEmail: parent.email,
          studentName: `${student.firstname} ${student.lastname}`,
          teamName: team.name,
          schoolName: school?.name || 'TBD',
          sessionDate: sessionDate,
          sessionTime: sessionTime,
          schoolLocation: school?.location || 'TBD',
          reminderType: '30d' // 30-day reminder for sessions starting September 17th 2025
        });

        if (emailResult.success) {
          sentCount++;
          results.push({
            success: true,
            to: parent.email,
            parentName: `${parent.firstname} ${parent.lastname}`,
            studentName: `${student.firstname} ${student.lastname}`,
            teamName: team.name,
            messageId: emailResult.messageId
          });

          console.log(`✅ Reminder sent to ${parent.email} for ${student.firstname} ${student.lastname}`);
        } else {
          throw new Error(emailResult.error || 'Unknown email error');
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to send reminder to ${parent.email}:`, error);
        
        results.push({
          success: false,
          to: parent.email,
          parentName: `${parent.firstname} ${parent.lastname}`,
          studentName: `${student.firstname} ${student.lastname}`,
          teamName: team.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: "September 17th session reminders processing completed",
      total: sessionsOnDate.length,
      sent: sentCount,
      errors: errorCount,
      results: results
    });

  } catch (error) {
    console.error("❌ September 17th reminder error:", error);
    return NextResponse.json(
      {
        message: "An error occurred while processing September 17th reminders",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
