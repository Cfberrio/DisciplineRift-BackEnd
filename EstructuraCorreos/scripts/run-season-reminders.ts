#!/usr/bin/env npx tsx

/**
 * Script CLI para ejecutar manualmente el job de recordatorios de temporada
 * 
 * Uso:
 *   npm run season-reminders              # Ejecutar con fecha actual
 *   npm run season-reminders:dry-run     # Modo dry-run (sin enviar emails)
 *   npm run season-reminders:test        # Ejecutar con fecha específica para testing
 */

// Cargar variables de entorno desde .env.local
import dotenv from 'dotenv';
import path from 'path';

// Cargar .env.local primero, luego .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { DateTime } from 'luxon';
import { runSeasonReminders, checkSeasonRemindersConfig } from '../jobs/sendSeasonReminders';

// Configuración
const TIMEZONE = 'America/New_York';

// Parsear argumentos de línea de comandos
const args = process.argv.slice(2);
const isDryRun = process.env.DRY_RUN === '1' || args.includes('--dry-run');
const testDate = process.env.TEST_DATE || args.find(arg => arg.startsWith('--date='))?.split('=')[1];
const isHelp = args.includes('--help') || args.includes('-h');

function showHelp() {
  console.log(`
🏐 Script de Recordatorios de Temporada - Discipline Rift

DESCRIPCIÓN:
  Ejecuta el job de recordatorios de temporada para enviar emails a padres
  cuando la temporada de su equipo comienza en exactamente 30 días.

USO:
  npx tsx scripts/run-season-reminders.ts [OPCIONES]

OPCIONES:
  --dry-run               Modo de prueba (no envía emails reales)
  --date=YYYY-MM-DD      Ejecutar como si fuera esta fecha específica
  --help, -h             Mostrar esta ayuda

VARIABLES DE ENTORNO:
  DRY_RUN=1              Habilitar modo dry-run
  TEST_DATE=YYYY-MM-DD   Fecha específica para testing

EJEMPLOS:
  # Ejecutar normalmente
  npx tsx scripts/run-season-reminders.ts
  
  # Modo dry-run (no envía emails)
  npx tsx scripts/run-season-reminders.ts --dry-run
  
  # Testing con fecha específica
  npx tsx scripts/run-season-reminders.ts --date=2024-01-15
  
  # Con variables de entorno
  DRY_RUN=1 TEST_DATE=2024-01-15 npx tsx scripts/run-season-reminders.ts

CONFIGURACIÓN REQUERIDA:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - GMAIL_USER
  - GMAIL_APP_PASSWORD
`);
}

async function main() {
  try {
    if (isHelp) {
      showHelp();
      process.exit(0);
    }

    console.log('🚀 === SCRIPT CLI DE RECORDATORIOS DE TEMPORADA ===');
    
    if (isDryRun) {
      console.log('⚠️ MODO DRY-RUN ACTIVADO - NO SE ENVIARÁN EMAILS REALES');
    }

    // Preparar fecha de ejecución
    let executionDate: Date;
    if (testDate) {
      const parsedDate = DateTime.fromISO(testDate, { zone: TIMEZONE });
      if (!parsedDate.isValid) {
        throw new Error(`Fecha inválida: ${testDate}. Use formato YYYY-MM-DD`);
      }
      executionDate = parsedDate.toJSDate();
      console.log(`🧪 MODO TEST - Ejecutando como si fuera: ${testDate} (${TIMEZONE})`);
    } else {
      executionDate = DateTime.now().setZone(TIMEZONE).toJSDate();
      console.log(`📅 Ejecutando con fecha actual: ${DateTime.now().setZone(TIMEZONE).toISODate()} (${TIMEZONE})`);
    }

    // Verificar configuración
    console.log('\n🔍 Verificando configuración...');
    const configValid = await checkSeasonRemindersConfig();
    
    if (!configValid) {
      console.error('❌ La configuración no es válida. Verifique las variables de entorno:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL');
      console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
      console.error('   - GMAIL_USER');
      console.error('   - GMAIL_APP_PASSWORD');
      process.exit(1);
    }

    console.log('✅ Configuración válida');

    // Ejecutar el job
    console.log('\n🎯 Iniciando ejecución del job...');
    
    if (isDryRun) {
      console.log('🚨 ATENCIÓN: Este sería un dry-run, pero la función actual no soporta este modo.');
      console.log('   Los emails se enviarán realmente. Para implementar dry-run, modifique');
      console.log('   la función runSeasonReminders para aceptar un parámetro dryRun.');
    }

    await runSeasonReminders({ now: executionDate });
    
    console.log('\n✅ Ejecución completada exitosamente');
    
  } catch (error) {
    console.error('\n💥 Error durante la ejecución:', error);
    process.exit(1);
  }
}

// Manejar señales de interrupción
process.on('SIGINT', () => {
  console.log('\n⚠️ Ejecución interrumpida por el usuario');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️ Ejecución terminada');
  process.exit(0);
});

// Ejecutar script principal
main().catch((error) => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});
