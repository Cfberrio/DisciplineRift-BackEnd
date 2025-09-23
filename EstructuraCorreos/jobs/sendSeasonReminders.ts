// Cargar variables de entorno si no están disponibles (para scripts CLI)
if (typeof window === 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const dotenv = require('dotenv');
    const path = require('path');
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  } catch (error) {
    // dotenv no disponible, continuar sin él
  }
}

import { DateTime } from 'luxon';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { registerReminderAttempt, updateReminderAttemptStatus } from '../lib/retry-scheduler';

// Interfaces para tipado
interface SessionData {
  sessionid: string;
  teamid: string;
  startdate: string;
  enddate: string | null;
  starttime: string;
  endtime: string;
  daysofweek: string;
}

interface EnrollmentData {
  enrollmentid: string;
  studentid: string;
}

interface StudentData {
  studentid: string;
  parentid: string;
  firstname: string;
  lastname: string;
}

interface ParentData {
  parentid: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface TeamData {
  teamid: string;
  teamname?: string;
  name?: string;
}

interface EmailData {
  parentName: string;
  teamName: string;
  startDate: string;
  scheduleHtml: string;
}

// Configuración
const TIMEZONE = 'America/New_York';

// Cliente de Supabase usando la clave anónima (RLS habilitado)
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Transportador de email reutilizando la configuración existente
const createEmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail credentials not configured');
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

/**
 * Función robusta para parsear días de la semana
 * Acepta múltiples formatos: "Mon,Tue,Wed", "m, tue, wednesday", etc.
 */
function parseDaysOfWeek(daysOfWeek: string): number[] {
  if (!daysOfWeek || typeof daysOfWeek !== 'string') {
    return [];
  }

  const dayMapping: { [key: string]: number } = {
    // Nombres completos en inglés
    'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
    'friday': 5, 'saturday': 6, 'sunday': 7,
    
    // Abreviaciones de 3 letras
    'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4,
    'fri': 5, 'sat': 6, 'sun': 7,
    
    // Abreviaciones de 1 letra
    'm': 1, 't': 2, 'w': 3, 'r': 4, 'f': 5, 's': 6, 'u': 7,
    
    // Nombres en español (por si acaso)
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4,
    'viernes': 5, 'sábado': 6, 'domingo': 7
  };

  // Limpiar y dividir por múltiples separadores
  const cleanDays = daysOfWeek
    .toLowerCase()
    .split(/[,;|\s\/]+/)
    .map(day => day.trim())
    .filter(day => day.length > 0);

  const weekdays = new Set<number>();
  
  for (const day of cleanDays) {
    const weekday = dayMapping[day];
    if (weekday) {
      weekdays.add(weekday);
    }
  }

  return Array.from(weekdays).sort();
}

/**
 * Construye el HTML del horario de temporada con todas las ocurrencias
 */
function buildSeasonScheduleHtml(
  session: SessionData,
  timezone: string = TIMEZONE
): string {
  try {
    const startDate = DateTime.fromISO(session.startdate, { zone: timezone });
    const endDate = session.enddate 
      ? DateTime.fromISO(session.enddate, { zone: timezone })
      : startDate; // Si no hay enddate, solo incluir el día de inicio

    const weekdays = parseDaysOfWeek(session.daysofweek);
    
    // Si no hay días específicos, incluir el día de inicio
    if (weekdays.length === 0) {
      const startDateTime = startDate.set({
        hour: parseInt(session.starttime.split(':')[0]),
        minute: parseInt(session.starttime.split(':')[1] || '0')
      });
      
      const endDateTime = startDate.set({
        hour: parseInt(session.endtime.split(':')[0]),
        minute: parseInt(session.endtime.split(':')[1] || '0')
      });

      const formattedDate = startDateTime.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY, { locale: 'en-US' });
      const formattedTime = `${startDateTime.toLocaleString(DateTime.TIME_SIMPLE, { locale: 'en-US' })} – ${endDateTime.toLocaleString(DateTime.TIME_SIMPLE, { locale: 'en-US' })}`;
      
      return `<li>${formattedDate.split(', ')[0]}, ${formattedDate.split(', ')[1]}, ${formattedTime}</li>`;
    }

    const scheduleItems: string[] = [];
    let currentDate = startDate;

    // Iterar día por día desde startDate hasta endDate
    while (currentDate <= endDate && scheduleItems.length < 100) { // Límite de seguridad
      const currentWeekday = currentDate.weekday;
      
      if (weekdays.includes(currentWeekday)) {
        // Crear DateTime con las horas específicas
        const startDateTime = currentDate.set({
          hour: parseInt(session.starttime.split(':')[0]),
          minute: parseInt(session.starttime.split(':')[1] || '0')
        });
        
        const endDateTime = currentDate.set({
          hour: parseInt(session.endtime.split(':')[0]),
          minute: parseInt(session.endtime.split(':')[1] || '0')
        });

        // Formatear como "Tuesday, Jan 21, 6:00 PM – 7:00 PM" en inglés
        const formattedDate = startDateTime.toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY, { locale: 'en-US' });
        const timeRange = `${startDateTime.toLocaleString(DateTime.TIME_SIMPLE, { locale: 'en-US' })} – ${endDateTime.toLocaleString(DateTime.TIME_SIMPLE, { locale: 'en-US' })}`;
        
        scheduleItems.push(`<li>${formattedDate.split(' at ')[0]}, ${timeRange}</li>`);
      }
      
      currentDate = currentDate.plus({ days: 1 });
    }

    return scheduleItems.length > 0 ? scheduleItems.join('\n       ') : '<li>Schedule to be confirmed</li>';
  } catch (error) {
    console.error('Error building season schedule HTML:', error);
    return '<li>Schedule to be confirmed</li>';
  }
}

/**
 * Genera el HTML del email de recordatorio de temporada
 */
function createSeasonReminderEmailHtml(emailData: EmailData): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>Season Reminder</title>
    <style>
      @media (max-width: 600px) {
        .container { width: 100% !important; margin: 0 !important; }
        .content { padding: 20px !important; }
        .header { padding: 20px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="min-height:100vh;">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.1);">
            
            <!-- Header with logo and brand -->
            <tr>
              <td class="header" style="background:linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);padding:30px;text-align:center;">
                <div style="background:rgba(255,255,255,0.15);border-radius:50px;display:inline-block;padding:12px 24px;margin-bottom:16px;">
                  <span style="color:#ffffff;font-size:24px;font-weight:bold;letter-spacing:1px;">🏐 DISCIPLINE RIFT</span>
                </div>
                 <h1 style="color:#ffffff;font-size:28px;font-weight:bold;margin:0;text-shadow:0 2px 4px rgba(0,0,0,0.2);">
                   Tomorrow's the Big Day! ${emailData.teamName} Season Begins
                 </h1>
                 <p style="color:rgba(255,255,255,0.9);font-size:16px;margin:8px 0 0 0;">
                   Day Before Reminder
                 </p>
              </td>
            </tr>

            <!-- Main content -->
            <tr>
              <td class="content" style="padding:40px;">
                <div style="text-align:center;margin-bottom:32px;">
                   <div style="background:linear-gradient(135deg, #dc2626 0%, #ef4444 100%);color:#ffffff;padding:16px 24px;border-radius:50px;display:inline-block;font-weight:bold;font-size:18px;box-shadow:0 4px 12px rgba(220,38,38,0.3);">
                     🎉 Tomorrow's the Big Day!
                   </div>
                </div>

                <p style="margin:0 0 24px 0;font-size:18px;line-height:28px;color:#374151;text-align:center;">
                  Hi <strong style="color:#1e40af;">${emailData.parentName}</strong>,
                </p>
                
                 <div style="background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);border-radius:12px;padding:24px;margin:0 0 32px 0;border-left:4px solid #3b82f6;">
                   <p style="margin:0 0 16px 0;font-size:16px;line-height:26px;color:#475569;">
                     The wait is almost over — tomorrow we kick off the Discipline Rift season for <strong style="color:#1e40af;">${emailData.teamName}</strong>!
                   </p>
                   <p style="margin:0;font-size:16px;line-height:26px;color:#475569;">
                     We can't wait to see the players in action.
                   </p>
                 </div>

                <div style="background:#ffffff;border:2px solid #e5e7eb;border-radius:12px;padding:24px;margin:0 0 32px 0;">
                  <h3 style="margin:0 0 20px 0;font-size:20px;font-weight:bold;color:#1f2937;text-align:center;display:flex;align-items:center;justify-content:center;">
                    <span style="background:linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);color:#ffffff;padding:8px 16px;border-radius:20px;margin-right:12px;">📋</span>
                    Season Schedule
                  </h3>
                  <div style="background:#f8fafc;border-radius:8px;padding:20px;">
                    <ul style="margin:0;padding:0;list-style:none;font-size:15px;line-height:24px;color:#475569;">
                      ${emailData.scheduleHtml.replace(/<li>/g, '<li style="margin:0 0 8px 0;padding:8px 12px;background:#ffffff;border-radius:6px;border-left:3px solid #3b82f6;">').replace(/<\/li>/g, '</li>')}
                </ul>
                  </div>
                </div>

                <div style="text-align:center;margin:32px 0;">
                   <div style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);color:#ffffff;padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                     <h4 style="margin:0 0 8px 0;font-size:18px;font-weight:bold;">See you tomorrow!</h4>
                     <p style="margin:0;font-size:16px;opacity:0.9;">
                       Discipline Rift Team
                     </p>
                   </div>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e5e7eb;">
                <div style="margin-bottom:20px;">
                  <h4 style="color:#1f2937;font-size:18px;font-weight:bold;margin:0 0 12px 0;">Discipline Rift</h4>
                  <div style="color:#6b7280;font-size:14px;line-height:20px;">
                    <p style="margin:0 0 4px 0;">📧 Support: info@disciplinerift.com</p>
                    <p style="margin:0 0 4px 0;">📞 Phone: (407) 6147454</p>
                    <p style="margin:0;">🌐 Web: www.disciplinerift.com</p>
                  </div>
                </div>
                
                <div style="border-top:1px solid #d1d5db;padding-top:20px;margin-top:20px;">
                  <p style="color:#9ca3af;font-size:12px;margin:0;line-height:18px;">
                    This is an automated email. If you have any questions, please don't hesitate to contact us.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Función principal para ejecutar el job de recordatorios de temporada
 */
export async function runSeasonReminders(opts?: { now?: Date }): Promise<void> {
  console.log('🚀 === INICIANDO JOB DE RECORDATORIOS DE TEMPORADA ===');
  
  try {
     // Calcular fecha objetivo (hoy + 1 día en zona horaria de Nueva York)
     const nowNY = opts?.now 
       ? DateTime.fromJSDate(opts.now).setZone(TIMEZONE)
       : DateTime.now().setZone(TIMEZONE);
     
     const targetDateNY = nowNY.plus({ days: 1 }).toISODate();
    
    console.log(`📅 Fecha actual (NY): ${nowNY.toISODate()}`);
    console.log(`🎯 Buscando sesiones que inician en: ${targetDateNY}`);

    const supabase = createSupabaseClient();
    const transporter = createEmailTransporter();

     // 1. Buscar sesiones que inician exactamente en 1 día y cuyos equipos estén activos
     console.log('🔍 Consultando sesiones con equipos activos...');
     const { data: sessions, error: sessionsError } = await supabase
       .from('session')
       .select(`
         sessionid, 
         teamid, 
         startdate, 
         enddate, 
         starttime, 
         endtime, 
         daysofweek,
         team!inner(teamid, isactive, name)
       `)
       .eq('startdate', targetDateNY)
       .eq('team.isactive', true)
       .neq('team.name', 'PICKLEBALL PINECREST LAKES')
       .limit(1000);

    if (sessionsError) {
      throw new Error(`Error consultando sesiones: ${sessionsError.message}`);
    }

     console.log(`📊 Encontradas ${sessions?.length || 0} sesiones con equipos activos`);

    if (!sessions || sessions.length === 0) {
      console.log('✅ No hay sesiones para recordar hoy');
      return;
    }

    const emailsSent = new Set<string>(); // Para deduplicar emails por (parentid|sessionid)
    let totalEmailsSent = 0;
    let totalErrors = 0;

    // Procesar cada sesión
    for (const session of sessions) {
      console.log(`\n🏐 Procesando sesión ${session.sessionid} del equipo ${session.teamid}`);

      try {
        // 2. Buscar inscripciones activas para este equipo
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('enrollment')
          .select('enrollmentid, studentid')
          .eq('teamid', session.teamid)
          .eq('isactive', true)
          .limit(10000);

        if (enrollmentsError) {
          console.error(`❌ Error consultando inscripciones: ${enrollmentsError.message}`);
          totalErrors++;
          continue;
        }

        if (!enrollments || enrollments.length === 0) {
          console.log(`ℹ️ No hay inscripciones activas para el equipo ${session.teamid}`);
          continue;
        }

        console.log(`👥 Encontradas ${enrollments.length} inscripciones activas`);

        // 3. Buscar estudiantes
        const studentIds = enrollments.map(e => e.studentid);
        const { data: students, error: studentsError } = await supabase
          .from('student')
          .select('studentid, parentid, firstname, lastname')
          .in('studentid', studentIds);

        if (studentsError) {
          console.error(`❌ Error consultando estudiantes: ${studentsError.message}`);
          totalErrors++;
          continue;
        }

        if (!students || students.length === 0) {
          console.log(`ℹ️ No se encontraron estudiantes`);
          continue;
        }

        // 4. Buscar padres
        const parentIds = [...new Set(students.map(s => s.parentid))];
        const { data: parents, error: parentsError } = await supabase
          .from('parent')
          .select('parentid, firstname, lastname, email')
          .in('parentid', parentIds);

        if (parentsError) {
          console.error(`❌ Error consultando padres: ${parentsError.message}`);
          totalErrors++;
          continue;
        }

        if (!parents || parents.length === 0) {
          console.log(`ℹ️ No se encontraron padres`);
          continue;
        }

         // 5. Obtener nombre del equipo (ya incluido en la consulta)
         const teamName = session.team?.name || `Team ${session.teamid.slice(-8)}`;
         console.log(`✅ Nombre del equipo obtenido: ${teamName}`);

        // 6. Construir el horario de temporada
        const scheduleHtml = buildSeasonScheduleHtml(session);

        // 7. Enviar emails (deduplicando por parent + session)
        for (const parent of parents) {
          if (!parent.email) {
            console.log(`⚠️ Padre ${parent.parentid} sin email, saltando`);
            continue;
          }

          const emailKey = `${parent.parentid}|${session.sessionid}`;
          if (emailsSent.has(emailKey)) {
            console.log(`🔄 Email ya enviado a padre ${parent.parentid} para sesión ${session.sessionid}`);
            continue;
          }

          // Registrar intento antes de enviar
          const scheduledTime = nowNY.toJSDate();
          await registerReminderAttempt(
            session.sessionid,
            parent.parentid,
            'season_reminder',
            scheduledTime,
            'pending'
          );

          try {
            const startDate = DateTime.fromISO(session.startdate, { zone: TIMEZONE })
              .toLocaleString(DateTime.DATE_FULL, { locale: 'en-US' });

            const emailData: EmailData = {
              parentName: parent.firstname,
              teamName,
              startDate,
              scheduleHtml
            };

            const htmlContent = createSeasonReminderEmailHtml(emailData);
            const textContent = htmlContent
              .replace(/<[^>]*>/g, '') // Remover tags HTML
              .replace(/{{scheduleHtml}}/g, scheduleHtml.replace(/<li>/g, '- ').replace(/<\/li>/g, '\n'));

            const mailOptions = {
              from: {
                name: 'Discipline Rift',
                address: process.env.GMAIL_USER!,
              },
              to: parent.email,
               subject: `Tomorrow's the Big Day! ${teamName} Season Begins`,
              html: htmlContent,
              text: textContent
            };

            const result = await transporter.sendMail(mailOptions);
            console.log(`✅ Email enviado a ${parent.email} (${result.messageId})`);
            
            // Marcar intento como exitoso
            await updateReminderAttemptStatus(
              session.sessionid,
              parent.parentid,
              'season_reminder',
              'sent',
              undefined,
              result.messageId
            );
            
            emailsSent.add(emailKey);
            totalEmailsSent++;

          } catch (emailError) {
            console.error(`❌ Error enviando email a ${parent.email}:`, emailError);
            
            // Marcar intento como fallido
            await updateReminderAttemptStatus(
              session.sessionid,
              parent.parentid,
              'season_reminder',
              'failed',
              emailError instanceof Error ? emailError.message : 'Unknown email error'
            );
            
            totalErrors++;
          }
        }

      } catch (sessionError) {
        console.error(`❌ Error procesando sesión ${session.sessionid}:`, sessionError);
        totalErrors++;
      }
    }

    // Resumen final
    console.log('\n📊 === RESUMEN DEL JOB ===');
    console.log(`🎯 Sesiones procesadas: ${sessions.length}`);
    console.log(`📧 Emails enviados: ${totalEmailsSent}`);
    console.log(`❌ Errores: ${totalErrors}`);
    console.log('✅ Job completado exitosamente');

  } catch (error) {
    console.error('💥 Error fatal en el job de recordatorios de temporada:', error);
    throw error;
  }
}

// Función para verificar la configuración antes de ejecutar
export async function checkSeasonRemindersConfig(): Promise<boolean> {
  try {
    // Verificar Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Configuración de Supabase faltante');
      console.error('  Requeridas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return false;
    }

    // Verificar Gmail
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Configuración de Gmail faltante');
      console.error('  Requeridas: GMAIL_USER, GMAIL_APP_PASSWORD');
      return false;
    }

    console.log('✅ Configuración validada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
    return false;
  }
}

    // 1. Buscar sesiones que inician exactamente en 7 días
    console.log('🔍 Consultando sesiones...');

    const { data: sessions, error: sessionsError } = await supabase

      .from('session')

      .select('sessionid, teamid, startdate, enddate, starttime, endtime, daysofweek')

      .eq('startdate', targetDateNY)

      .limit(1000);



    if (sessionsError) {

      throw new Error(`Error consultando sesiones: ${sessionsError.message}`);

    }



    console.log(`📊 Encontradas ${sessions?.length || 0} sesiones`);



    if (!sessions || sessions.length === 0) {

      console.log('✅ No hay sesiones para recordar hoy');

      return;

    }



    const emailsSent = new Set<string>(); // Para deduplicar emails por (parentid|sessionid)

    let totalEmailsSent = 0;

    let totalErrors = 0;



    // Procesar cada sesión

    for (const session of sessions) {

      console.log(`\n🏐 Procesando sesión ${session.sessionid} del equipo ${session.teamid}`);



      try {

        // 2. Buscar inscripciones activas para este equipo

        const { data: enrollments, error: enrollmentsError } = await supabase

          .from('enrollment')

          .select('enrollmentid, studentid')

          .eq('teamid', session.teamid)

          .eq('isactive', true)

          .limit(10000);



        if (enrollmentsError) {

          console.error(`❌ Error consultando inscripciones: ${enrollmentsError.message}`);

          totalErrors++;

          continue;

        }



        if (!enrollments || enrollments.length === 0) {

          console.log(`ℹ️ No hay inscripciones activas para el equipo ${session.teamid}`);

          continue;

        }



        console.log(`👥 Encontradas ${enrollments.length} inscripciones activas`);



        // 3. Buscar estudiantes

        const studentIds = enrollments.map(e => e.studentid);

        const { data: students, error: studentsError } = await supabase

          .from('student')

          .select('studentid, parentid, firstname, lastname')

          .in('studentid', studentIds);



        if (studentsError) {

          console.error(`❌ Error consultando estudiantes: ${studentsError.message}`);

          totalErrors++;

          continue;

        }



        if (!students || students.length === 0) {

          console.log(`ℹ️ No se encontraron estudiantes`);

          continue;

        }



        // 4. Buscar padres

        const parentIds = [...new Set(students.map(s => s.parentid))];

        const { data: parents, error: parentsError } = await supabase

          .from('parent')

          .select('parentid, firstname, lastname, email')

          .in('parentid', parentIds);



        if (parentsError) {

          console.error(`❌ Error consultando padres: ${parentsError.message}`);

          totalErrors++;

          continue;

        }



        if (!parents || parents.length === 0) {

          console.log(`ℹ️ No se encontraron padres`);

          continue;

        }



        // 5. Buscar nombre del equipo (requerido)
        let teamName = `Team ${session.teamid.slice(-8)}`;
        try {

          const { data: teamData, error: teamError } = await supabase
            .from('team')

            .select('name')
            .eq('teamid', session.teamid)

            .single();

          

          if (teamError) {
            console.log(`⚠️ Error consultando equipo ${session.teamid}: ${teamError.message}`);
          } else if (teamData) {
            teamName = teamData.name || teamName;
            console.log(`✅ Nombre del equipo obtenido: ${teamName}`);
          }

        } catch (error) {

          console.log(`ℹ️ No se pudo obtener el nombre del equipo, usando fallback: ${teamName}`);

        }



        // 6. Construir el horario de temporada

        const scheduleHtml = buildSeasonScheduleHtml(session);



        // 7. Enviar emails (deduplicando por parent + session)

        for (const parent of parents) {

          if (!parent.email) {

            console.log(`⚠️ Padre ${parent.parentid} sin email, saltando`);

            continue;

          }



          const emailKey = `${parent.parentid}|${session.sessionid}`;

          if (emailsSent.has(emailKey)) {

            console.log(`🔄 Email ya enviado a padre ${parent.parentid} para sesión ${session.sessionid}`);

            continue;

          }



          // Registrar intento antes de enviar

          const scheduledTime = nowNY.toJSDate();

          await registerReminderAttempt(

            session.sessionid,

            parent.parentid,

            'season_reminder',

            scheduledTime,

            'pending'

          );



          try {

            const startDate = DateTime.fromISO(session.startdate, { zone: TIMEZONE })

              .toLocaleString(DateTime.DATE_FULL, { locale: 'en-US' });


            const emailData: EmailData = {

              parentName: parent.firstname,

              teamName,

              startDate,

              scheduleHtml

            };



            const htmlContent = createSeasonReminderEmailHtml(emailData);

            const textContent = htmlContent

              .replace(/<[^>]*>/g, '') // Remover tags HTML

              .replace(/{{scheduleHtml}}/g, scheduleHtml.replace(/<li>/g, '- ').replace(/<\/li>/g, '\n'));



            const mailOptions = {

              from: {

                name: 'Discipline Rift',

                address: process.env.GMAIL_USER!,

              },

              to: parent.email,

              subject: `Just 1 Week Until ${teamName} Season Kickoff!`,
              html: htmlContent,

              text: textContent

            };



            const result = await transporter.sendMail(mailOptions);

            console.log(`✅ Email enviado a ${parent.email} (${result.messageId})`);

            

            // Marcar intento como exitoso

            await updateReminderAttemptStatus(

              session.sessionid,

              parent.parentid,

              'season_reminder',

              'sent',

              undefined,

              result.messageId

            );

            

            emailsSent.add(emailKey);

            totalEmailsSent++;



          } catch (emailError) {

            console.error(`❌ Error enviando email a ${parent.email}:`, emailError);

            

            // Marcar intento como fallido

            await updateReminderAttemptStatus(

              session.sessionid,

              parent.parentid,

              'season_reminder',

              'failed',

              emailError instanceof Error ? emailError.message : 'Unknown email error'

            );

            

            totalErrors++;

          }

        }



      } catch (sessionError) {

        console.error(`❌ Error procesando sesión ${session.sessionid}:`, sessionError);

        totalErrors++;

      }

    }



    // Resumen final

    console.log('\n📊 === RESUMEN DEL JOB ===');

    console.log(`🎯 Sesiones procesadas: ${sessions.length}`);

    console.log(`📧 Emails enviados: ${totalEmailsSent}`);

    console.log(`❌ Errores: ${totalErrors}`);

    console.log('✅ Job completado exitosamente');



  } catch (error) {

    console.error('💥 Error fatal en el job de recordatorios de temporada:', error);

    throw error;

  }

}



// Función para verificar la configuración antes de ejecutar

export async function checkSeasonRemindersConfig(): Promise<boolean> {

  try {

    // Verificar Supabase

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    

    if (!supabaseUrl || !supabaseKey) {

      console.error('❌ Configuración de Supabase faltante');

      console.error('  Requeridas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');

      return false;

    }



    // Verificar Gmail

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {

      console.error('❌ Configuración de Gmail faltante');

      console.error('  Requeridas: GMAIL_USER, GMAIL_APP_PASSWORD');

      return false;

    }



    console.log('✅ Configuración validada correctamente');

    return true;

  } catch (error) {

    console.error('❌ Error verificando configuración:', error);

    return false;

  }

}



    // 1. Buscar sesiones que inician exactamente en 7 días
    console.log('🔍 Consultando sesiones...');

    const { data: sessions, error: sessionsError } = await supabase

      .from('session')

      .select('sessionid, teamid, startdate, enddate, starttime, endtime, daysofweek')

      .eq('startdate', targetDateNY)

      .limit(1000);



    if (sessionsError) {

      throw new Error(`Error consultando sesiones: ${sessionsError.message}`);

    }



    console.log(`📊 Encontradas ${sessions?.length || 0} sesiones`);



    if (!sessions || sessions.length === 0) {

      console.log('✅ No hay sesiones para recordar hoy');

      return;

    }



    const emailsSent = new Set<string>(); // Para deduplicar emails por (parentid|sessionid)

    let totalEmailsSent = 0;

    let totalErrors = 0;



    // Procesar cada sesión

    for (const session of sessions) {

      console.log(`\n🏐 Procesando sesión ${session.sessionid} del equipo ${session.teamid}`);



      try {

        // 2. Buscar inscripciones activas para este equipo

        const { data: enrollments, error: enrollmentsError } = await supabase

          .from('enrollment')

          .select('enrollmentid, studentid')

          .eq('teamid', session.teamid)

          .eq('isactive', true)

          .limit(10000);



        if (enrollmentsError) {

          console.error(`❌ Error consultando inscripciones: ${enrollmentsError.message}`);

          totalErrors++;

          continue;

        }



        if (!enrollments || enrollments.length === 0) {

          console.log(`ℹ️ No hay inscripciones activas para el equipo ${session.teamid}`);

          continue;

        }



        console.log(`👥 Encontradas ${enrollments.length} inscripciones activas`);



        // 3. Buscar estudiantes

        const studentIds = enrollments.map(e => e.studentid);

        const { data: students, error: studentsError } = await supabase

          .from('student')

          .select('studentid, parentid, firstname, lastname')

          .in('studentid', studentIds);



        if (studentsError) {

          console.error(`❌ Error consultando estudiantes: ${studentsError.message}`);

          totalErrors++;

          continue;

        }



        if (!students || students.length === 0) {

          console.log(`ℹ️ No se encontraron estudiantes`);

          continue;

        }



        // 4. Buscar padres

        const parentIds = [...new Set(students.map(s => s.parentid))];

        const { data: parents, error: parentsError } = await supabase

          .from('parent')

          .select('parentid, firstname, lastname, email')

          .in('parentid', parentIds);



        if (parentsError) {

          console.error(`❌ Error consultando padres: ${parentsError.message}`);

          totalErrors++;

          continue;

        }



        if (!parents || parents.length === 0) {

          console.log(`ℹ️ No se encontraron padres`);

          continue;

        }



        // 5. Buscar nombre del equipo (requerido)
        let teamName = `Team ${session.teamid.slice(-8)}`;
        try {

          const { data: teamData, error: teamError } = await supabase
            .from('team')

            .select('name')
            .eq('teamid', session.teamid)

            .single();

          

          if (teamError) {
            console.log(`⚠️ Error consultando equipo ${session.teamid}: ${teamError.message}`);
          } else if (teamData) {
            teamName = teamData.name || teamName;
            console.log(`✅ Nombre del equipo obtenido: ${teamName}`);
          }

        } catch (error) {

          console.log(`ℹ️ No se pudo obtener el nombre del equipo, usando fallback: ${teamName}`);

        }



        // 6. Construir el horario de temporada

        const scheduleHtml = buildSeasonScheduleHtml(session);



        // 7. Enviar emails (deduplicando por parent + session)

        for (const parent of parents) {

          if (!parent.email) {

            console.log(`⚠️ Padre ${parent.parentid} sin email, saltando`);

            continue;

          }



          const emailKey = `${parent.parentid}|${session.sessionid}`;

          if (emailsSent.has(emailKey)) {

            console.log(`🔄 Email ya enviado a padre ${parent.parentid} para sesión ${session.sessionid}`);

            continue;

          }



          // Registrar intento antes de enviar

          const scheduledTime = nowNY.toJSDate();

          await registerReminderAttempt(

            session.sessionid,

            parent.parentid,

            'season_reminder',

            scheduledTime,

            'pending'

          );



          try {

            const startDate = DateTime.fromISO(session.startdate, { zone: TIMEZONE })

              .toLocaleString(DateTime.DATE_FULL, { locale: 'en-US' });


            const emailData: EmailData = {

              parentName: parent.firstname,

              teamName,

              startDate,

              scheduleHtml

            };



            const htmlContent = createSeasonReminderEmailHtml(emailData);

            const textContent = htmlContent

              .replace(/<[^>]*>/g, '') // Remover tags HTML

              .replace(/{{scheduleHtml}}/g, scheduleHtml.replace(/<li>/g, '- ').replace(/<\/li>/g, '\n'));



            const mailOptions = {

              from: {

                name: 'Discipline Rift',

                address: process.env.GMAIL_USER!,

              },

              to: parent.email,

              subject: `Just 1 Week Until ${teamName} Season Kickoff!`,
              html: htmlContent,

              text: textContent

            };



            const result = await transporter.sendMail(mailOptions);

            console.log(`✅ Email enviado a ${parent.email} (${result.messageId})`);

            

            // Marcar intento como exitoso

            await updateReminderAttemptStatus(

              session.sessionid,

              parent.parentid,

              'season_reminder',

              'sent',

              undefined,

              result.messageId

            );

            

            emailsSent.add(emailKey);

            totalEmailsSent++;



          } catch (emailError) {

            console.error(`❌ Error enviando email a ${parent.email}:`, emailError);

            

            // Marcar intento como fallido

            await updateReminderAttemptStatus(

              session.sessionid,

              parent.parentid,

              'season_reminder',

              'failed',

              emailError instanceof Error ? emailError.message : 'Unknown email error'

            );

            

            totalErrors++;

          }

        }



      } catch (sessionError) {

        console.error(`❌ Error procesando sesión ${session.sessionid}:`, sessionError);

        totalErrors++;

      }

    }



    // Resumen final

    console.log('\n📊 === RESUMEN DEL JOB ===');

    console.log(`🎯 Sesiones procesadas: ${sessions.length}`);

    console.log(`📧 Emails enviados: ${totalEmailsSent}`);

    console.log(`❌ Errores: ${totalErrors}`);

    console.log('✅ Job completado exitosamente');



  } catch (error) {

    console.error('💥 Error fatal en el job de recordatorios de temporada:', error);

    throw error;

  }

}



// Función para verificar la configuración antes de ejecutar

export async function checkSeasonRemindersConfig(): Promise<boolean> {

  try {

    // Verificar Supabase

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    

    if (!supabaseUrl || !supabaseKey) {

      console.error('❌ Configuración de Supabase faltante');

      console.error('  Requeridas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');

      return false;

    }



    // Verificar Gmail

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {

      console.error('❌ Configuración de Gmail faltante');

      console.error('  Requeridas: GMAIL_USER, GMAIL_APP_PASSWORD');

      return false;

    }



    console.log('✅ Configuración validada correctamente');

    return true;

  } catch (error) {

    console.error('❌ Error verificando configuración:', error);

    return false;

  }

}



    // 1. Buscar sesiones que inician exactamente en 7 días
    console.log('🔍 Consultando sesiones...');

    const { data: sessions, error: sessionsError } = await supabase

      .from('session')

      .select('sessionid, teamid, startdate, enddate, starttime, endtime, daysofweek')

      .eq('startdate', targetDateNY)

      .limit(1000);



    if (sessionsError) {

      throw new Error(`Error consultando sesiones: ${sessionsError.message}`);

    }



    console.log(`📊 Encontradas ${sessions?.length || 0} sesiones`);



    if (!sessions || sessions.length === 0) {

      console.log('✅ No hay sesiones para recordar hoy');

      return;

    }



    const emailsSent = new Set<string>(); // Para deduplicar emails por (parentid|sessionid)

    let totalEmailsSent = 0;

    let totalErrors = 0;



    // Procesar cada sesión

    for (const session of sessions) {

      console.log(`\n🏐 Procesando sesión ${session.sessionid} del equipo ${session.teamid}`);



      try {

        // 2. Buscar inscripciones activas para este equipo

        const { data: enrollments, error: enrollmentsError } = await supabase

          .from('enrollment')

          .select('enrollmentid, studentid')

          .eq('teamid', session.teamid)

          .eq('isactive', true)

          .limit(10000);



        if (enrollmentsError) {

          console.error(`❌ Error consultando inscripciones: ${enrollmentsError.message}`);

          totalErrors++;

          continue;

        }



        if (!enrollments || enrollments.length === 0) {

          console.log(`ℹ️ No hay inscripciones activas para el equipo ${session.teamid}`);

          continue;

        }



        console.log(`👥 Encontradas ${enrollments.length} inscripciones activas`);



        // 3. Buscar estudiantes

        const studentIds = enrollments.map(e => e.studentid);

        const { data: students, error: studentsError } = await supabase

          .from('student')

          .select('studentid, parentid, firstname, lastname')

          .in('studentid', studentIds);



        if (studentsError) {

          console.error(`❌ Error consultando estudiantes: ${studentsError.message}`);

          totalErrors++;

          continue;

        }



        if (!students || students.length === 0) {

          console.log(`ℹ️ No se encontraron estudiantes`);

          continue;

        }



        // 4. Buscar padres

        const parentIds = [...new Set(students.map(s => s.parentid))];

        const { data: parents, error: parentsError } = await supabase

          .from('parent')

          .select('parentid, firstname, lastname, email')

          .in('parentid', parentIds);



        if (parentsError) {

          console.error(`❌ Error consultando padres: ${parentsError.message}`);

          totalErrors++;

          continue;

        }



        if (!parents || parents.length === 0) {

          console.log(`ℹ️ No se encontraron padres`);

          continue;

        }



        // 5. Buscar nombre del equipo (requerido)
        let teamName = `Team ${session.teamid.slice(-8)}`;
        try {

          const { data: teamData, error: teamError } = await supabase
            .from('team')

            .select('name')
            .eq('teamid', session.teamid)

            .single();

          

          if (teamError) {
            console.log(`⚠️ Error consultando equipo ${session.teamid}: ${teamError.message}`);
          } else if (teamData) {
            teamName = teamData.name || teamName;
            console.log(`✅ Nombre del equipo obtenido: ${teamName}`);
          }

        } catch (error) {

          console.log(`ℹ️ No se pudo obtener el nombre del equipo, usando fallback: ${teamName}`);

        }



        // 6. Construir el horario de temporada

        const scheduleHtml = buildSeasonScheduleHtml(session);



        // 7. Enviar emails (deduplicando por parent + session)

        for (const parent of parents) {

          if (!parent.email) {

            console.log(`⚠️ Padre ${parent.parentid} sin email, saltando`);

            continue;

          }



          const emailKey = `${parent.parentid}|${session.sessionid}`;

          if (emailsSent.has(emailKey)) {

            console.log(`🔄 Email ya enviado a padre ${parent.parentid} para sesión ${session.sessionid}`);

            continue;

          }



          // Registrar intento antes de enviar

          const scheduledTime = nowNY.toJSDate();

          await registerReminderAttempt(

            session.sessionid,

            parent.parentid,

            'season_reminder',

            scheduledTime,

            'pending'

          );



          try {

            const startDate = DateTime.fromISO(session.startdate, { zone: TIMEZONE })

              .toLocaleString(DateTime.DATE_FULL, { locale: 'en-US' });


            const emailData: EmailData = {

              parentName: parent.firstname,

              teamName,

              startDate,

              scheduleHtml

            };



            const htmlContent = createSeasonReminderEmailHtml(emailData);

            const textContent = htmlContent

              .replace(/<[^>]*>/g, '') // Remover tags HTML

              .replace(/{{scheduleHtml}}/g, scheduleHtml.replace(/<li>/g, '- ').replace(/<\/li>/g, '\n'));



            const mailOptions = {

              from: {

                name: 'Discipline Rift',

                address: process.env.GMAIL_USER!,

              },

              to: parent.email,

              subject: `Just 1 Week Until ${teamName} Season Kickoff!`,
              html: htmlContent,

              text: textContent

            };



            const result = await transporter.sendMail(mailOptions);

            console.log(`✅ Email enviado a ${parent.email} (${result.messageId})`);

            

            // Marcar intento como exitoso

            await updateReminderAttemptStatus(

              session.sessionid,

              parent.parentid,

              'season_reminder',

              'sent',

              undefined,

              result.messageId

            );

            

            emailsSent.add(emailKey);

            totalEmailsSent++;



          } catch (emailError) {

            console.error(`❌ Error enviando email a ${parent.email}:`, emailError);

            

            // Marcar intento como fallido

            await updateReminderAttemptStatus(

              session.sessionid,

              parent.parentid,

              'season_reminder',

              'failed',

              emailError instanceof Error ? emailError.message : 'Unknown email error'

            );

            

            totalErrors++;

          }

        }



      } catch (sessionError) {

        console.error(`❌ Error procesando sesión ${session.sessionid}:`, sessionError);

        totalErrors++;

      }

    }



    // Resumen final

    console.log('\n📊 === RESUMEN DEL JOB ===');

    console.log(`🎯 Sesiones procesadas: ${sessions.length}`);

    console.log(`📧 Emails enviados: ${totalEmailsSent}`);

    console.log(`❌ Errores: ${totalErrors}`);

    console.log('✅ Job completado exitosamente');



  } catch (error) {

    console.error('💥 Error fatal en el job de recordatorios de temporada:', error);

    throw error;

  }

}



// Función para verificar la configuración antes de ejecutar

export async function checkSeasonRemindersConfig(): Promise<boolean> {

  try {

    // Verificar Supabase

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    

    if (!supabaseUrl || !supabaseKey) {

      console.error('❌ Configuración de Supabase faltante');

      console.error('  Requeridas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');

      return false;

    }



    // Verificar Gmail

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {

      console.error('❌ Configuración de Gmail faltante');

      console.error('  Requeridas: GMAIL_USER, GMAIL_APP_PASSWORD');

      return false;

    }



    console.log('✅ Configuración validada correctamente');

    return true;

  } catch (error) {

    console.error('❌ Error verificando configuración:', error);

    return false;

  }

}


