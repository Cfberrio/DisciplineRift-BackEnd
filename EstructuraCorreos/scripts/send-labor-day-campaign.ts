#!/usr/bin/env tsx

/**
 * Script para enviar la campaña promocional del Labor Day
 * 
 * Este script envía un correo promocional con el código de descuento LABORDAY
 * a todos los suscriptores de la tabla newsletter.
 * 
 * Uso:
 * npm run send-labor-day-campaign
 * o
 * npx tsx scripts/send-labor-day-campaign.ts
 */

async function runLaborDayCampaign() {
  try {
    console.log("🎉 === INICIANDO CAMPAÑA PROMOCIONAL LABOR DAY ===")
    console.log(`🕐 Hora de inicio: ${new Date().toLocaleString()}`)
    
    // Hacer petición al endpoint
    const response = await fetch('http://localhost:3000/api/send-labor-day-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log("✅ === CAMPAÑA COMPLETADA EXITOSAMENTE ===")
      console.log(`📊 Resumen:`)
      console.log(`   - Total de suscriptores: ${result.totalSubscribers}`)
      console.log(`   - Correos enviados: ${result.emailsSent}`)
      console.log(`   - Correos fallidos: ${result.emailsFailed}`)
      
      if (result.results?.failed?.length > 0) {
        console.log("\n❌ Correos fallidos:")
        result.results.failed.forEach((failed: any) => {
          console.log(`   - ${failed.email}: ${failed.error}`)
        })
      }
      
      if (result.results?.sent?.length > 0) {
        console.log("\n✅ Primeros 5 correos enviados exitosamente:")
        result.results.sent.slice(0, 5).forEach((email: string) => {
          console.log(`   - ${email}`)
        })
        if (result.results.sent.length > 5) {
          console.log(`   ... y ${result.results.sent.length - 5} más`)
        }
      }
      
    } else {
      console.error("❌ === CAMPAÑA FALLIDA ===")
      console.error(`Error: ${result.message}`)
      if (result.error) {
        console.error(`Detalles: ${result.error}`)
      }
    }
    
    console.log(`🕐 Hora de finalización: ${new Date().toLocaleString()}`)
    
  } catch (error) {
    console.error("❌ === ERROR CRÍTICO EN LA CAMPAÑA ===")
    console.error("Error:", error)
    process.exit(1)
  }
}

// Función para obtener información previa de la campaña
async function getCampaignInfo() {
  try {
    console.log("📋 Obteniendo información de la campaña...")
    
    const response = await fetch('http://localhost:3000/api/send-labor-day-email', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log("📊 === INFORMACIÓN DE LA CAMPAÑA ===")
      console.log(`   - Total de suscriptores: ${result.totalSubscribers}`)
      console.log(`   - Gmail configurado: ${result.gmailConfigured ? '✅' : '❌'}`)
      console.log(`   - Template: ${result.emailTemplate}`)
      return result.totalSubscribers > 0 && result.gmailConfigured
    } else {
      console.error("❌ Error obteniendo información:", result.message)
      return false
    }
    
  } catch (error) {
    console.error("❌ Error crítico obteniendo información:", error)
    return false
  }
}

// Función principal
async function main() {
  console.log("🚀 === SCRIPT CAMPAÑA LABOR DAY ===")
  console.log("")
  
  // Obtener información previa
  const canRun = await getCampaignInfo()
  
  if (!canRun) {
    console.log("❌ No se puede ejecutar la campaña. Verifica la configuración.")
    process.exit(1)
  }
  
  console.log("")
  console.log("¿Estás seguro de que quieres enviar la campaña promocional?")
  console.log("Presiona Ctrl+C para cancelar o Enter para continuar...")
  
  // Esperar confirmación
  await new Promise((resolve) => {
    process.stdin.once('data', () => resolve(void 0))
  })
  
  console.log("")
  await runLaborDayCampaign()
}

// Ejecutar el script
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Error crítico:", error)
    process.exit(1)
  })
}

export { runLaborDayCampaign, getCampaignInfo }






















