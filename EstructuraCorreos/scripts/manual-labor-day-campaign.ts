#!/usr/bin/env tsx

/**
 * Script manual para enviar la campaña promocional del Labor Day
 * 
 * Este script obtiene todos los emails de la tabla newsletter y envía
 * el correo promocional uno por uno usando el endpoint que funciona.
 */

import { supabaseAdmin } from "../lib/supabase-admin"

async function runManualLaborDayCampaign() {
  try {
    console.log("🎉 === INICIANDO CAMPAÑA MANUAL LABOR DAY ===")
    console.log(`🕐 Hora de inicio: ${new Date().toLocaleString()}`)
    
    // Obtener todos los emails de la tabla newsletter
    console.log("🔍 Obteniendo suscriptores del newsletter...")
    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from('newsletter')
      .select('email')

    if (subscribersError) {
      console.error("❌ Error obteniendo suscriptores:", subscribersError)
      return
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("⚠️ No se encontraron suscriptores")
      return
    }

    console.log(`📬 Encontrados ${subscribers.length} suscriptores`)

    // Enviar correos uno por uno
    const results = {
      sent: [] as string[],
      failed: [] as { email: string; error: string }[]
    }

    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i]
      console.log(`📧 [${i + 1}/${subscribers.length}] Enviando a: ${subscriber.email}`)
      
      try {
        const response = await fetch('http://localhost:3000/api/send-labor-day-single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: subscriber.email })
        })
        
        const result = await response.json()
        
        if (result.success) {
          results.sent.push(subscriber.email)
          console.log(`✅ [${i + 1}/${subscribers.length}] Enviado exitosamente a: ${subscriber.email}`)
        } else {
          results.failed.push({
            email: subscriber.email,
            error: result.message || "Error desconocido"
          })
          console.error(`❌ [${i + 1}/${subscribers.length}] Error enviando a ${subscriber.email}: ${result.message}`)
        }
        
      } catch (error) {
        results.failed.push({
          email: subscriber.email,
          error: error instanceof Error ? error.message : "Error de red"
        })
        console.error(`❌ [${i + 1}/${subscribers.length}] Error de red enviando a ${subscriber.email}:`, error)
      }
      
      // Pausa entre emails
      console.log("⏳ Esperando 1 segundo...")
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log("\n🎯 === CAMPAÑA COMPLETADA ===")
    console.log(`📊 Resumen final:`)
    console.log(`   - Total de suscriptores: ${subscribers.length}`)
    console.log(`   - Correos enviados: ${results.sent.length}`)
    console.log(`   - Correos fallidos: ${results.failed.length}`)
    
    if (results.sent.length > 0) {
      console.log("\n✅ Correos enviados exitosamente:")
      results.sent.forEach((email, index) => {
        console.log(`   ${index + 1}. ${email}`)
      })
    }
    
    if (results.failed.length > 0) {
      console.log("\n❌ Correos fallidos:")
      results.failed.forEach((failed, index) => {
        console.log(`   ${index + 1}. ${failed.email} - ${failed.error}`)
      })
    }
    
    console.log(`\n🕐 Hora de finalización: ${new Date().toLocaleString()}`)
    
  } catch (error) {
    console.error("❌ === ERROR CRÍTICO EN LA CAMPAÑA ===")
    console.error("Error:", error)
    process.exit(1)
  }
}

// Ejecutar el script
if (require.main === module) {
  console.log("🚀 === SCRIPT CAMPAÑA MANUAL LABOR DAY ===")
  console.log("")
  
  runManualLaborDayCampaign().catch((error) => {
    console.error("❌ Error crítico:", error)
    process.exit(1)
  })
}

export { runManualLaborDayCampaign }






















