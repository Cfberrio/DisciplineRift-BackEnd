import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendSessionReminderEmail } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      session_id, 
      enrollment_id, 
      reminder_type, 
      parent_email,
      student_name,
      team_name,
      school_name,
      session_date,
      session_time,
      school_location 
    } = body;

    // Validar datos requeridos
    if (!session_id || !enrollment_id || !reminder_type || !parent_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verificar que no se haya enviado ya este recordatorio
    const { data: existingReminder } = await supabase
      .from('session_reminders')
      .select('id')
      .eq('session_id', session_id)
      .eq('enrollment_id', enrollment_id)
      .eq('reminder_type', reminder_type)
      .single();

    if (existingReminder) {
      return NextResponse.json(
        { message: 'Reminder already sent', skipped: true },
        { status: 200 }
      );
    }

    // Enviar email de recordatorio
    const emailResult = await sendSessionReminderEmail({
      parentEmail: parent_email,
      studentName: student_name,
      teamName: team_name,
      schoolName: school_name,
      sessionDate: session_date,
      sessionTime: session_time,
      schoolLocation: school_location,
      reminderType: reminder_type
    });

    if (!emailResult.success) {
      console.error('❌ Failed to send reminder email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Registrar el recordatorio enviado
    const { error: insertError } = await supabase
      .from('session_reminders')
      .insert({
        session_id,
        enrollment_id,
        parent_email,
        reminder_type,
        sent_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Failed to record reminder:', insertError);
      return NextResponse.json(
        { error: 'Failed to record reminder' },
        { status: 500 }
      );
    }

    console.log(`✅ Reminder sent successfully: ${reminder_type} for ${student_name}`);

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      reminder_type,
      student_name,
      parent_email
    });

  } catch (error) {
    console.error('❌ Error sending reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

