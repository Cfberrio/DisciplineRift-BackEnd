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

import * as cron from 'node-cron';
import { DateTime } from 'luxon';
import { createClient } from '@supabase/supabase-js';
import { runSeasonReminders } from '../jobs/sendSeasonReminders';

// Configuración
const TIMEZONE = 'America/New_York';
const RETRY_INTERVAL_MINUTES = 20;
const MAX_RETRY_ATTEMPTS = 3;

// Cliente de Supabase
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing for retry scheduler');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

let retrySchedulerTask: cron.ScheduledTask | null = null;

/**
 * Procesa reintentos de recordatorios fallidos
 */
async function processRetryAttempts(): Promise<void> {
  console.log('🔄 === PROCESANDO REINTENTOS DE RECORDATORIOS ===');
  
  try {
    const supabase = createSupabaseClient();
    const now = DateTime.now().setZone(TIMEZONE);
    
    // Buscar intentos pendientes que necesitan reintento
    const cutoffTime = now.minus({ minutes: RETRY_INTERVAL_MINUTES }).toISO();
    
    const { data: failedAttempts, error } = await supabase
      .from('reminder_attempts')
      .select('*')
      .in('status', ['failed', 'pending'])
      .lt('scheduled_time', cutoffTime)
      .lt('attempt_number', MAX_RETRY_ATTEMPTS + 1)
      .order('scheduled_time', { ascending: true })
      .limit(50); // Procesar máximo 50 reintentos por vez
    
    if (error) {
      console.error('❌ Error consultando intentos fallidos:', error);
      return;
    }
    
    if (!failedAttempts || failedAttempts.length === 0) {
      console.log('ℹ️ No hay reintentos pendientes');
      return;
    }
    
    console.log(`📊 Encontrados ${failedAttempts.length} reintentos pendientes`);
    
    // Agrupar por sesión para ejecutar el job completo por sesión
    const sessionGroups = new Map();
    for (const attempt of failedAttempts) {
      if (!sessionGroups.has(attempt.session_id)) {
        sessionGroups.set(attempt.session_id, []);
      }
      sessionGroups.get(attempt.session_id).push(attempt);
    }
    
    console.log(`🎯 Procesando ${sessionGroups.size} sesiones con reintentos`);
    
    // Procesar cada grupo de sesión
    for (const [sessionId, attempts] of sessionGroups) {
      try {
        console.log(`\n🏐 Procesando reintentos para sesión ${sessionId}`);
        
        // Marcar intentos como "retrying"
        const attemptIds = attempts.map(a => a.id);
        await supabase
          .from('reminder_attempts')
          .update({ 
            status: 'retrying',
            updated_at: now.toISO()
          })
          .in('id', attemptIds);
        
        // Obtener información de la sesión para calcular fecha objetivo
        const { data: session, error: sessionError } = await supabase
          .from('session')
          .select('startdate')
          .eq('sessionid', sessionId)
          .single();
        
        if (sessionError || !session) {
          console.error(`❌ Error obteniendo sesión ${sessionId}:`, sessionError);
          
          // Marcar intentos como fallidos
          await supabase
            .from('reminder_attempts')
            .update({ 
              status: 'failed',
              error_message: 'Session not found',
              updated_at: now.toISO()
            })
            .in('id', attemptIds);
          continue;
        }
        
        // Calcular la fecha que sería "hoy" para que esta sesión sea +30 días
        const sessionStart = DateTime.fromISO(session.startdate, { zone: TIMEZONE });
        const targetNow = sessionStart.minus({ days: 30 });
        
        console.log(`📅 Ejecutando reintento como si fuera: ${targetNow.toISODate()}`);
        
        // Ejecutar el job de recordatorios para esta fecha específica
        await runSeasonReminders({ now: targetNow.toJSDate() });
        
        // Si llegamos aquí, el reintento fue exitoso
        console.log(`✅ Reintento exitoso para sesión ${sessionId}`);
        
        // Los intentos exitosos se marcarán como 'sent' dentro de runSeasonReminders
        // Solo necesitamos limpiar los que quedaron en 'retrying' y no se enviaron
        const { data: stillRetrying } = await supabase
          .from('reminder_attempts')
          .select('id')
          .eq('session_id', sessionId)
          .eq('status', 'retrying');
        
        if (stillRetrying && stillRetrying.length > 0) {
          await supabase
            .from('reminder_attempts')
            .update({ 
              status: 'failed',
              error_message: 'Retry completed but email not sent',
              updated_at: now.toISO()
            })
            .in('id', stillRetrying.map(r => r.id));
        }
        
      } catch (retryError) {
        console.error(`❌ Error en reintento para sesión ${sessionId}:`, retryError);
        
        // Incrementar número de intento y marcar como fallido si excede el máximo
        for (const attempt of attempts) {
          const newAttemptNumber = attempt.attempt_number + 1;
          const newStatus = newAttemptNumber > MAX_RETRY_ATTEMPTS ? 'failed' : 'pending';
          const nextScheduledTime = newStatus === 'pending' 
            ? now.plus({ minutes: RETRY_INTERVAL_MINUTES }).toISO()
            : attempt.scheduled_time;
          
          await supabase
            .from('reminder_attempts')
            .update({
              attempt_number: newAttemptNumber,
              status: newStatus,
              error_message: retryError instanceof Error ? retryError.message : 'Unknown retry error',
              scheduled_time: nextScheduledTime,
              updated_at: now.toISO()
            })
            .eq('id', attempt.id);
        }
      }
    }
    
    console.log('✅ Procesamiento de reintentos completado');
    
  } catch (error) {
    console.error('💥 Error fatal en procesamiento de reintentos:', error);
  }
}

/**
 * Inicia el scheduler de reintentos
 */
export function startRetryScheduler(): boolean {
  try {
    if (retrySchedulerTask) {
      console.log('⚠️ Scheduler de reintentos ya está activo');
      return true;
    }
    
    console.log('🚀 Iniciando scheduler de reintentos...');
    console.log(`⏰ Programado para ejecutar cada ${RETRY_INTERVAL_MINUTES} minutos`);
    
    // Ejecutar cada 20 minutos
    const cronExpression = `*/${RETRY_INTERVAL_MINUTES} * * * *`;
    
    retrySchedulerTask = cron.schedule(
      cronExpression,
      async () => {
        try {
          console.log(`\n🔄 === EJECUTANDO SCHEDULER DE REINTENTOS ===`);
          console.log(`⏰ Hora: ${DateTime.now().setZone(TIMEZONE).toLocaleString(DateTime.DATETIME_MED)}`);
          
          await processRetryAttempts();
          
        } catch (error) {
          console.error('💥 Error en scheduler de reintentos:', error);
        }
      },
      {
        scheduled: true,
        timezone: TIMEZONE
      }
    );
    
    console.log('✅ Scheduler de reintentos iniciado exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error iniciando scheduler de reintentos:', error);
    return false;
  }
}

/**
 * Detiene el scheduler de reintentos
 */
export function stopRetryScheduler(): boolean {
  try {
    if (retrySchedulerTask) {
      retrySchedulerTask.stop();
      retrySchedulerTask.destroy();
      retrySchedulerTask = null;
      console.log('🛑 Scheduler de reintentos detenido');
      return true;
    } else {
      console.log('ℹ️ Scheduler de reintentos no estaba activo');
      return true;
    }
  } catch (error) {
    console.error('❌ Error deteniendo scheduler de reintentos:', error);
    return false;
  }
}

/**
 * Verifica si el scheduler de reintentos está activo
 */
export function isRetrySchedulerActive(): boolean {
  return retrySchedulerTask !== null && retrySchedulerTask.getStatus() === 'scheduled';
}

/**
 * Registra un intento de recordatorio para futuros reintentos
 */
export async function registerReminderAttempt(
  sessionId: string,
  parentId: string,
  emailType: string = 'season_reminder',
  scheduledTime: Date,
  status: 'pending' | 'sent' | 'failed' = 'pending',
  errorMessage?: string,
  emailSentId?: string
): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    
    const attemptData = {
      session_id: sessionId,
      parent_id: parentId,
      email_type: emailType,
      attempt_number: 1,
      scheduled_time: scheduledTime.toISOString(),
      status,
      error_message: errorMessage,
      email_sent_id: emailSentId
    };
    
    // Usar upsert para evitar duplicados
    const { error } = await supabase
      .from('reminder_attempts')
      .upsert(attemptData, {
        onConflict: 'session_id,parent_id,email_type'
      });
    
    if (error) {
      console.error('❌ Error registrando intento de recordatorio:', error);
    } else {
      console.log(`📝 Intento registrado: ${sessionId} -> ${parentId} (${status})`);
    }
    
  } catch (error) {
    console.error('❌ Error en registerReminderAttempt:', error);
  }
}

/**
 * Actualiza el estado de un intento de recordatorio
 */
export async function updateReminderAttemptStatus(
  sessionId: string,
  parentId: string,
  emailType: string,
  status: 'sent' | 'failed',
  errorMessage?: string,
  emailSentId?: string
): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    const now = DateTime.now().setZone(TIMEZONE);
    
    const updateData: any = {
      status,
      updated_at: now.toISO()
    };
    
    if (status === 'sent') {
      updateData.executed_time = now.toISO();
      if (emailSentId) {
        updateData.email_sent_id = emailSentId;
      }
    } else if (status === 'failed' && errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    const { error } = await supabase
      .from('reminder_attempts')
      .update(updateData)
      .eq('session_id', sessionId)
      .eq('parent_id', parentId)
      .eq('email_type', emailType);
    
    if (error) {
      console.error('❌ Error actualizando estado de intento:', error);
    }
    
  } catch (error) {
    console.error('❌ Error en updateReminderAttemptStatus:', error);
  }
}
