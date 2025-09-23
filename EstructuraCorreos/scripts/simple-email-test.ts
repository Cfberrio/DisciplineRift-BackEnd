#!/usr/bin/env npx tsx

/**
 * Prueba simple del sistema de envío de emails
 */

// Cargar variables de entorno
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { DateTime } from 'luxon';
import nodemailer from 'nodemailer';

async function testEmailSending() {
  try {
    console.log('📧 === PRUEBA SIMPLE DE ENVÍO DE EMAIL ===');
    
    // Verificar configuración
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Configuración de Gmail faltante');
      console.error('Verifique que GMAIL_USER y GMAIL_APP_PASSWORD están en .env.local');
      return;
    }
    
    console.log('✅ Configuración de Gmail encontrada');
    console.log(`📤 Enviando desde: ${process.env.GMAIL_USER}`);
    
    // Crear transportador
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    
    // Verificar conexión
    console.log('🔍 Verificando conexión SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP válida');
    
    // Crear email de prueba
    const now = DateTime.now().setZone('America/New_York');
    const testDate = now.plus({ days: 30 }).toLocaleString(DateTime.DATE_FULL);
    
    const htmlContent = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width,initial-scale=1"/>
        <title>Season Reminder Test</title>
      </head>
      <body style="margin:0;padding:0;background:#f6f9fc;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding:24px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;color:#111827;">
                    <h2 style="color:#1e40af;">🏐 Discipline Rift - Prueba de Sistema</h2>
                    <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;">
                      Hi <strong>Usuario de Prueba</strong>,
                    </p>
                    <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;">
                      This is a test email from the <strong>Discipline Rift</strong> season reminder system.
                      If you receive this email, it means the system is working correctly!
                    </p>
                    <p style="margin:0 0 16px 0;font-size:16px;line-height:24px;">
                      🎯 Test completed on: ${now.toLocaleString(DateTime.DATETIME_FULL)}
                    </p>
                    <h3 style="margin:24px 0 8px 0;font-size:18px;line-height:26px;color:#111827;">Sample Season Schedule</h3>
                    <ul style="margin:0 0 16px 20px;padding:0;font-size:16px;line-height:24px;color:#111827;">
                      <li>Monday, ${testDate}, 6:00 PM – 7:30 PM</li>
                      <li>Wednesday, ${testDate}, 6:00 PM – 7:30 PM</li>
                      <li>Friday, ${testDate}, 6:00 PM – 7:30 PM</li>
                    </ul>
                    <div style="background:#10b981;color:white;padding:16px;border-radius:8px;margin:20px 0;">
                      <strong>✅ Sistema de recordatorios funcionando correctamente</strong>
                    </div>
                    <p style="margin:0;font-size:16px;line-height:24px;"><strong>Discipline Rift Team</strong></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`;
    
    const textContent = `
Discipline Rift - Prueba de Sistema

Hi Usuario de Prueba,

This is a test email from the Discipline Rift season reminder system.
If you receive this email, it means the system is working correctly!

Test completed on: ${now.toLocaleString(DateTime.DATETIME_FULL)}

Sample Season Schedule:
- Monday, ${testDate}, 6:00 PM – 7:30 PM
- Wednesday, ${testDate}, 6:00 PM – 7:30 PM
- Friday, ${testDate}, 6:00 PM – 7:30 PM

✅ Sistema de recordatorios funcionando correctamente

Discipline Rift Team
    `;
    
    // Configurar email
    const mailOptions = {
      from: {
        name: 'Discipline Rift Test',
        address: process.env.GMAIL_USER,
      },
      to: process.env.GMAIL_USER, // Enviar a ti mismo para prueba
      subject: 'Test Team Season Starts in One Month! Discipline Rift',
      html: htmlContent,
      text: textContent
    };
    
    console.log('📤 Enviando email de prueba...');
    console.log(`📧 Para: ${mailOptions.to}`);
    console.log(`📋 Asunto: ${mailOptions.subject}`);
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('\n🎉 === EMAIL ENVIADO EXITOSAMENTE ===');
    console.log(`✅ Message ID: ${result.messageId}`);
    console.log(`📧 Email enviado a: ${mailOptions.to}`);
    console.log(`🕐 Hora de envío: ${now.toLocaleString(DateTime.DATETIME_FULL)}`);
    
    console.log('\n📋 === RESUMEN DE LA PRUEBA ===');
    console.log('✅ Configuración de Gmail: OK');
    console.log('✅ Conexión SMTP: OK');
    console.log('✅ Envío de email: OK');
    console.log('✅ Template HTML: OK');
    console.log('✅ Template de texto: OK');
    
    console.log('\n🎯 === PRÓXIMOS PASOS ===');
    console.log('1. Revisa tu bandeja de entrada');
    console.log('2. Verifica que el email se vea correctamente');
    console.log('3. El sistema de recordatorios está listo para usarse');
    console.log('4. Puedes crear datos de prueba en Supabase para probar el flujo completo');
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('\n💥 ERROR EN PRUEBA DE EMAIL:');
    console.error(error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        console.error('\n🔧 SOLUCIÓN SUGERIDA:');
        console.error('1. Verifica que GMAIL_APP_PASSWORD sea correcto');
        console.error('2. Asegúrate de que 2FA esté habilitado en Gmail');
        console.error('3. Genera una nueva App Password si es necesario');
      } else if (error.message.includes('connection')) {
        console.error('\n🔧 SOLUCIÓN SUGERIDA:');
        console.error('1. Verifica tu conexión a internet');
        console.error('2. Verifica que no haya firewall bloqueando SMTP');
      }
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Ejecutar prueba
testEmailSending()
  .then((result) => {
    if (result.success) {
      console.log('\n🎉 ¡PRUEBA COMPLETADA EXITOSAMENTE!');
      process.exit(0);
    } else {
      console.log('\n❌ Prueba fallida');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
