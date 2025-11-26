import { type NextRequest, NextResponse } from "next/server"
import { signUnsubToken } from "@/lib/mailer/unsub"

interface ValidationResult {
  status: "ok" | "error" | "warning"
  value?: string
  message: string
}

interface ValidationResponse {
  success: boolean
  variables: Record<string, ValidationResult>
  testUrls?: {
    unsubscribe: string
    viewInBrowser: string
  }
  recommendations: string[]
}

function maskValue(value: string, showChars: number = 10): string {
  if (value.length <= showChars) {
    return value.substring(0, 3) + "***"
  }
  return value.substring(0, showChars) + "***"
}

export async function GET(request: NextRequest) {
  console.log('[VALIDATE-ENV] Starting environment validation...')
  
  const results: Record<string, ValidationResult> = {}
  const recommendations: string[] = []
  let hasErrors = false

  // 1. Validate APP_BASE_URL
  const appBaseUrl = process.env.APP_BASE_URL
  if (!appBaseUrl) {
    results.APP_BASE_URL = {
      status: "error",
      message: "Variable APP_BASE_URL no está definida. Debe ser la URL base de tu aplicación (ej: https://www.disciplinerift.com)"
    }
    hasErrors = true
    recommendations.push("Agrega APP_BASE_URL=https://www.disciplinerift.com a tu .env.local")
  } else {
    const trimmedUrl = appBaseUrl.trim()
    const hasProtocol = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')
    const endsWithSlash = trimmedUrl.endsWith('/')
    const containsApiPath = trimmedUrl.includes('/api/')
    
    if (!hasProtocol) {
      results.APP_BASE_URL = {
        status: "error",
        value: maskValue(trimmedUrl),
        message: "APP_BASE_URL debe empezar con http:// o https://"
      }
      hasErrors = true
      recommendations.push("Corrige APP_BASE_URL para que empiece con https://")
    } else if (endsWithSlash) {
      results.APP_BASE_URL = {
        status: "warning",
        value: maskValue(trimmedUrl),
        message: "APP_BASE_URL no debe terminar con /. Se recomienda removerlo."
      }
      recommendations.push(`Cambia APP_BASE_URL de "${trimmedUrl}" a "${trimmedUrl.slice(0, -1)}"`)
    } else if (containsApiPath) {
      results.APP_BASE_URL = {
        status: "error",
        value: maskValue(trimmedUrl),
        message: "APP_BASE_URL NO debe contener rutas como /api/. Solo debe ser el dominio base. Esto causa URLs duplicadas."
      }
      hasErrors = true
      recommendations.push(`Cambia APP_BASE_URL a solo el dominio: ${trimmedUrl.split('/api/')[0]}`)
    } else {
      results.APP_BASE_URL = {
        status: "ok",
        value: maskValue(trimmedUrl),
        message: "Configuración correcta"
      }
    }
  }

  // 2. Validate UNSUBSCRIBE_JWT_SECRET
  const jwtSecret = process.env.UNSUBSCRIBE_JWT_SECRET
  if (!jwtSecret) {
    results.UNSUBSCRIBE_JWT_SECRET = {
      status: "error",
      message: "Variable UNSUBSCRIBE_JWT_SECRET no está definida. Debe ser una clave secreta de al menos 32 caracteres."
    }
    hasErrors = true
    recommendations.push("Agrega UNSUBSCRIBE_JWT_SECRET con una clave aleatoria de 32+ caracteres a tu .env.local")
  } else {
    const trimmedSecret = jwtSecret.trim()
    const hasSpaces = jwtSecret !== trimmedSecret || jwtSecret.includes(' ')
    
    if (hasSpaces) {
      results.UNSUBSCRIBE_JWT_SECRET = {
        status: "error",
        value: `${trimmedSecret.length} chars (contiene espacios)`,
        message: "UNSUBSCRIBE_JWT_SECRET no debe contener espacios"
      }
      hasErrors = true
      recommendations.push("Remueve espacios de UNSUBSCRIBE_JWT_SECRET")
    } else if (trimmedSecret.length < 32) {
      results.UNSUBSCRIBE_JWT_SECRET = {
        status: "error",
        value: `${trimmedSecret.length} chars`,
        message: `UNSUBSCRIBE_JWT_SECRET debe tener al menos 32 caracteres (actual: ${trimmedSecret.length})`
      }
      hasErrors = true
      recommendations.push("Genera una clave más larga para UNSUBSCRIBE_JWT_SECRET (mínimo 32 caracteres)")
    } else {
      results.UNSUBSCRIBE_JWT_SECRET = {
        status: "ok",
        value: `${trimmedSecret.length} chars`,
        message: "Configuración correcta"
      }
    }
  }

  // 3. Validate SUPABASE_SERVICE_ROLE_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    results.SUPABASE_SERVICE_ROLE_KEY = {
      status: "error",
      message: "Variable SUPABASE_SERVICE_ROLE_KEY no está definida. Es necesaria para operaciones de unsubscribe."
    }
    hasErrors = true
    recommendations.push("Agrega SUPABASE_SERVICE_ROLE_KEY desde tu proyecto de Supabase (Settings > API)")
  } else {
    const trimmedKey = serviceRoleKey.trim()
    const hasSpaces = serviceRoleKey !== trimmedKey || serviceRoleKey.includes(' ')
    const startsWithEyJ = trimmedKey.startsWith('eyJ')
    
    if (hasSpaces) {
      results.SUPABASE_SERVICE_ROLE_KEY = {
        status: "error",
        value: maskValue(trimmedKey),
        message: "SUPABASE_SERVICE_ROLE_KEY no debe contener espacios"
      }
      hasErrors = true
      recommendations.push("Remueve espacios de SUPABASE_SERVICE_ROLE_KEY")
    } else if (!startsWithEyJ) {
      results.SUPABASE_SERVICE_ROLE_KEY = {
        status: "warning",
        value: maskValue(trimmedKey),
        message: "SUPABASE_SERVICE_ROLE_KEY no parece ser un JWT válido (debería empezar con 'eyJ')"
      }
      recommendations.push("Verifica que SUPABASE_SERVICE_ROLE_KEY sea la clave correcta desde Supabase Settings > API")
    } else {
      results.SUPABASE_SERVICE_ROLE_KEY = {
        status: "ok",
        value: maskValue(trimmedKey),
        message: "Configuración correcta"
      }
    }
  }

  // 4. Validate SMTP variables for relay
  const relayHost = process.env.RELAY_HOST
  const relayPort = process.env.RELAY_PORT
  const relayUser = process.env.RELAY_USER
  const relayPass = process.env.RELAY_PASS

  if (relayHost) {
    if (relayHost.trim() !== 'smtp-relay.gmail.com') {
      results.RELAY_HOST = {
        status: "warning",
        value: maskValue(relayHost),
        message: "RELAY_HOST debería ser 'smtp-relay.gmail.com' para Google Workspace SMTP Relay"
      }
      recommendations.push("Cambia RELAY_HOST=smtp-relay.gmail.com")
    } else {
      results.RELAY_HOST = {
        status: "ok",
        value: relayHost,
        message: "Configuración correcta"
      }
    }
  }

  if (relayPort) {
    if (relayPort.trim() !== '587') {
      results.RELAY_PORT = {
        status: "warning",
        value: relayPort,
        message: "RELAY_PORT debería ser '587' para STARTTLS"
      }
      recommendations.push("Cambia RELAY_PORT=587")
    } else {
      results.RELAY_PORT = {
        status: "ok",
        value: relayPort,
        message: "Configuración correcta"
      }
    }
  }

  if (relayUser) {
    if (!relayUser.includes('@')) {
      results.RELAY_USER = {
        status: "error",
        value: maskValue(relayUser),
        message: "RELAY_USER debe ser un email válido"
      }
      hasErrors = true
      recommendations.push("Verifica que RELAY_USER sea un email válido (ej: luis@disciplinerift.com)")
    } else {
      results.RELAY_USER = {
        status: "ok",
        value: maskValue(relayUser),
        message: "Configuración correcta"
      }
    }
  }

  if (relayPass) {
    const trimmedPass = relayPass.trim()
    const hasSpaces = relayPass !== trimmedPass
    
    if (hasSpaces) {
      results.RELAY_PASS = {
        status: "error",
        value: `${trimmedPass.length} chars (contiene espacios)`,
        message: "RELAY_PASS no debe contener espacios al inicio o final"
      }
      hasErrors = true
      recommendations.push("Remueve espacios de RELAY_PASS")
    } else if (trimmedPass.length < 16) {
      results.RELAY_PASS = {
        status: "warning",
        value: `${trimmedPass.length} chars`,
        message: "RELAY_PASS parece corto. App Passwords de Google tienen 16 caracteres."
      }
      recommendations.push("Verifica que RELAY_PASS sea un App Password válido de 16 caracteres")
    } else {
      results.RELAY_PASS = {
        status: "ok",
        value: `${trimmedPass.length} chars`,
        message: "Configuración correcta"
      }
    }
  }

  // 5. Validate SMTP variables for gmail
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_PASS

  if (gmailUser) {
    if (!gmailUser.includes('@gmail.com')) {
      results.GMAIL_USER = {
        status: "warning",
        value: maskValue(gmailUser),
        message: "GMAIL_USER debería ser una cuenta @gmail.com"
      }
      recommendations.push("Verifica que GMAIL_USER sea una cuenta @gmail.com válida")
    } else {
      results.GMAIL_USER = {
        status: "ok",
        value: maskValue(gmailUser),
        message: "Configuración correcta"
      }
    }
  }

  if (gmailPass) {
    const trimmedPass = gmailPass.trim()
    const hasSpaces = gmailPass !== trimmedPass
    
    if (hasSpaces) {
      results.GMAIL_PASS = {
        status: "error",
        value: `${trimmedPass.length} chars (contiene espacios)`,
        message: "GMAIL_PASS no debe contener espacios"
      }
      hasErrors = true
      recommendations.push("Remueve espacios de GMAIL_PASS")
    } else if (trimmedPass.length !== 16) {
      results.GMAIL_PASS = {
        status: "warning",
        value: `${trimmedPass.length} chars`,
        message: "GMAIL_PASS debería tener exactamente 16 caracteres (App Password)"
      }
      recommendations.push("Verifica que GMAIL_PASS sea un App Password válido de 16 caracteres")
    } else {
      results.GMAIL_PASS = {
        status: "ok",
        value: `${trimmedPass.length} chars`,
        message: "Configuración correcta"
      }
    }
  }

  // Generate test URLs if APP_BASE_URL is valid
  let testUrls: { unsubscribe: string; viewInBrowser: string } | undefined

  if (results.APP_BASE_URL?.status === "ok" && appBaseUrl && jwtSecret) {
    try {
      const testToken = signUnsubToken("test@example.com")
      const baseUrl = appBaseUrl.trim().replace(/\/$/, '') // Remove trailing slash if present
      
      const unsubscribeUrl = `${baseUrl}/api/email-marketing/unsubscribe?token=${testToken}`
      const viewInBrowserUrl = `${baseUrl}/newsletter/view?token=${testToken}`
      
      // Check for duplicated paths
      const hasDuplicatedPath = unsubscribeUrl.includes('/api/email-marketing/unsubscribe/api/email-marketing/unsubscribe')
      
      if (hasDuplicatedPath) {
        results.APP_BASE_URL = {
          status: "error",
          value: maskValue(appBaseUrl),
          message: "APP_BASE_URL está causando URLs duplicadas. Debe ser solo el dominio base sin rutas."
        }
        hasErrors = true
        recommendations.push("Corrige APP_BASE_URL para que sea solo https://www.disciplinerift.com (sin /api/...)")
      } else {
        testUrls = {
          unsubscribe: unsubscribeUrl,
          viewInBrowser: viewInBrowserUrl
        }
      }
    } catch (error) {
      console.error('[VALIDATE-ENV] Error generating test URLs:', error)
    }
  }

  const response: ValidationResponse = {
    success: !hasErrors,
    variables: results,
    testUrls,
    recommendations: recommendations.length > 0 ? recommendations : ["Todas las variables están correctamente configuradas"]
  }

  console.log('[VALIDATE-ENV] Validation completed:', {
    success: response.success,
    errorsCount: Object.values(results).filter(r => r.status === 'error').length,
    warningsCount: Object.values(results).filter(r => r.status === 'warning').length,
  })

  return NextResponse.json(response, { status: response.success ? 200 : 400 })
}




