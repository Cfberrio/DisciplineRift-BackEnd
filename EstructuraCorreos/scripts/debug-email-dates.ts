#!/usr/bin/env npx tsx

/**
 * Script para debuggear específicamente las fechas en el email
 */

// Cargar variables de entorno
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { buildPracticeOccurrences, formatTimeES } from '../lib/schedule/buildPracticeOccurrences';

function debugEmailDates() {
  console.log('🔍 === DEBUG DE FECHAS DEL EMAIL ===');
  
  // Datos exactos como vienen de la base de datos según tu problema
  const sessionData = {
    startdate: '2025-09-18', // Jueves según la DB
    enddate: '2025-10-23',
    starttime: '15:15:00',   // Con segundos como viene de Supabase
    endtime: '16:15:00',
    daysofweek: 'Wednesday'  // Pero queremos miércoles
  };

  console.log('\n📋 DATOS ORIGINALES (como vienen de Supabase):');
  console.log(JSON.stringify(sessionData, null, 2));

  // Proceso igual que en el email service
  console.log('\n🔄 PROCESANDO COMO EN EMAIL SERVICE...');

  // 1. Parse days of week
  let daysOfWeek: string[] = [];
  try {
    if (typeof sessionData.daysofweek === "string") {
      const rawValue = sessionData.daysofweek.trim();
      if (rawValue.includes(",")) {
        daysOfWeek = rawValue.split(",").map((day: string) => day.trim());
      } else {
        daysOfWeek = [rawValue];
      }
    }
  } catch (error) {
    console.warn("Error parsing days of week:", error);
    daysOfWeek = ["Monday", "Wednesday", "Friday"];
  }

  console.log('Días de la semana parseados:', daysOfWeek);

  // 2. Clean times (remove seconds)
  const cleanStartTime = sessionData.starttime?.includes(':') 
    ? sessionData.starttime.substring(0, 5) 
    : sessionData.starttime;
  const cleanEndTime = sessionData.endtime?.includes(':') 
    ? sessionData.endtime.substring(0, 5) 
    : sessionData.endtime;

  console.log('Tiempos limpiados:');
  console.log(`  Start: ${sessionData.starttime} -> ${cleanStartTime}`);
  console.log(`  End: ${sessionData.endtime} -> ${cleanEndTime}`);

  // 3. Parametros para buildPracticeOccurrences
  const params = {
    startDate: sessionData.startdate,
    endDate: sessionData.enddate,
    daysOfWeek,
    startTime: cleanStartTime,
    endTime: cleanEndTime,
    location: 'Orlando, FL',
    coachName: 'Ranya',
    timezone: 'America/New_York'
  };

  console.log('\n📋 PARÁMETROS ENVIADOS A buildPracticeOccurrences:');
  console.log(JSON.stringify(params, null, 2));

  // 4. Generar occurrences
  console.log('\n⚙️ GENERANDO PRACTICE OCCURRENCES...');
  const practiceOccurrences = buildPracticeOccurrences(params);

  console.log(`📊 Generadas ${practiceOccurrences.length} sesiones:`);
  
  practiceOccurrences.forEach((occurrence, index) => {
    const timeFormatted = formatTimeES(occurrence.time);
    console.log(`\n${index + 1}. ${occurrence.formattedDateES}`);
    console.log(`   Time: ${timeFormatted}`);
    console.log(`   Raw date object: ${occurrence.date.toString()}`);
    console.log(`   UTC: ${occurrence.date.toISOString().split('T')[0]}`);
    console.log(`   Local: ${occurrence.date.getFullYear()}-${String(occurrence.date.getMonth() + 1).padStart(2, '0')}-${String(occurrence.date.getDate()).padStart(2, '0')}`);
  });

  // 5. Verificación específica del problema
  console.log('\n🎯 === VERIFICACIÓN DEL PROBLEMA ===');
  if (practiceOccurrences.length > 0) {
    const firstPractice = practiceOccurrences[0];
    const dateInEmail = firstPractice.formattedDateES;
    
    console.log(`Fecha que aparecerá en el email: "${dateInEmail}"`);
    
    // Extraer el día del mes de la fecha formateada
    const dayMatch = dateInEmail.match(/(\d{1,2})/);
    if (dayMatch) {
      const dayInEmail = parseInt(dayMatch[1]);
      console.log(`Día del mes en el email: ${dayInEmail}`);
      
      // Verificar el problema
      if (dayInEmail === 17) {
        console.log('✅ CORRECTO: Muestra el 17 (miércoles correcto)');
      } else if (dayInEmail === 16) {
        console.log('❌ PROBLEMA CONFIRMADO: Muestra el 16 (un día antes)');
      } else if (dayInEmail === 24) {
        console.log('⚠️ Muestra el 24 (siguiente miércoles después del 18)');
      } else {
        console.log(`🤔 Muestra el día ${dayInEmail} - verificar manualmente`);
      }
    }

    // Información adicional
    console.log('\n📅 CONTEXTO:');
    console.log('- Base de datos dice: 2025-09-18 (jueves)');
    console.log('- Buscamos día: Wednesday (miércoles)');
    console.log('- Miércoles anterior: 2025-09-17');
    console.log('- Miércoles siguiente: 2025-09-24');
    console.log(`- El email muestra: ${dateInEmail}`);
  }

  return practiceOccurrences;
}

// Ejecutar debug
try {
  const result = debugEmailDates();
  console.log(`\n🎉 Debug completado. Analizadas ${result.length} sesiones.`);
} catch (error) {
  console.error('💥 Error en debug:', error);
}
