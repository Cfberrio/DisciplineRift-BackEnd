#!/usr/bin/env npx tsx

/**
 * Script para probar específicamente el email de confirmación de pago
 */

// Cargar variables de entorno
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { sendPaymentConfirmationEmail } from '../lib/email-service';

async function testPaymentEmail() {
  console.log('📧 === PRUEBA DE EMAIL DE CONFIRMACIÓN DE PAGO ===');
  
  // Datos simulados exactamente como vienen del payment confirmation
  const studentData = {
    firstName: 'María',
    lastName: 'Pérez',
    grade: '10th Grade',
    emergencyContact: {
      name: 'Ana Pérez',
      phone: '555-0124',
      relationship: 'Aunt'
    }
  };

  const teamData = {
    teamid: 'test-team-id',
    name: 'VOLLEYBALL LAUREATE PARK',
    description: 'Elite volleyball training program',
    price: 299,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    school: {
      name: 'Laureate Park School',
      location: 'Orlando, FL'
    },
    // DATOS CRÍTICOS - Estos son los que causan el problema
    session: [{
      sessionid: 'test-session-id',
      startdate: '2025-09-18', // Base de datos dice 18 de septiembre
      enddate: '2025-10-23',
      starttime: '15:15:00',   // Como viene de Supabase con segundos
      endtime: '16:15:00',
      daysofweek: 'Wednesday', // Miércoles
      staff: {
        name: 'Ranya',
        email: 'ranya@example.com',
        phone: '555-0125'
      }
    }]
  };

  const paymentData = {
    amount: 299,
    date: new Date().toISOString(),
    sessionId: 'test-session-id'
  };

  const parentData = {
    firstName: 'Juan',
    lastName: 'Pérez',
    email: process.env.GMAIL_USER || 'test@example.com'
  };

  console.log('\n🔍 DATOS DE ENTRADA:');
  console.log('Session startdate:', teamData.session[0].startdate);
  console.log('Session daysofweek:', teamData.session[0].daysofweek);
  console.log('Session starttime:', teamData.session[0].starttime);
  console.log('Session endtime:', teamData.session[0].endtime);
  
  // Verificar qué día es 2025-09-18
  const testDate = new Date(2025, 8, 18); // Septiembre es mes 8
  console.log('\n📅 VERIFICACIÓN:');
  console.log(`2025-09-18 es: ${testDate.toLocaleDateString('en-US', { weekday: 'long' })}`);
  console.log('Pero estamos buscando: Wednesday');
  console.log('Por tanto, la primera práctica DEBERÍA ser el miércoles anterior (17) o siguiente (24)');

  console.log('\n📤 Enviando email de prueba...');
  
  try {
    const result = await sendPaymentConfirmationEmail(
      parentData.email,
      studentData,
      teamData,
      paymentData,
      parentData
    );

    if (result.success) {
      console.log('\n✅ EMAIL ENVIADO EXITOSAMENTE');
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📬 Enviado a: ${parentData.email}`);
      console.log('\n🔍 VERIFICA EN TU EMAIL:');
      console.log('1. ¿La primera fecha de práctica es miércoles 17 o 24 de septiembre?');
      console.log('2. ¿O está mostrando una fecha incorrecta?');
      console.log('3. ¿Las horas son correctas (3:15 PM - 4:15 PM)?');
    } else {
      console.error('\n❌ ERROR ENVIANDO EMAIL');
      console.error('Error:', result.error);
    }

  } catch (error) {
    console.error('\n💥 ERROR EN LA PRUEBA:', error);
  }
}

// Ejecutar prueba
testPaymentEmail().catch(console.error);
