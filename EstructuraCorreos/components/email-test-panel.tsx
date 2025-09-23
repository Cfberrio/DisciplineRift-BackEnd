"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Send, CheckCircle, XCircle, Loader2, Bug, Database } from "lucide-react"

export default function EmailTestPanel() {
  const [testEmail, setTestEmail] = useState("")
  const [debugEnrollmentId, setDebugEnrollmentId] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)
  const [configStatus, setConfigStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null)
  const [debugResult, setDebugResult] = useState<any>(null)

  const checkEmailConfiguration = async () => {
    setIsChecking(true)
    setConfigStatus(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "GET",
      })

      const data = await response.json()

      setConfigStatus({
        success: data.success,
        message: data.success ? "✅ Configuración de email válida" : `❌ Error: ${data.error}`,
      })
    } catch (error) {
      setConfigStatus({
        success: false,
        message: `❌ Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}`,
      })
    } finally {
      setIsChecking(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      setEmailResult({
        success: false,
        message: "Por favor ingresa un email válido",
      })
      return
    }

    setIsSending(true)
    setEmailResult(null)

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: testEmail }),
      })

      const data = await response.json()

      setEmailResult({
        success: data.success,
        message: data.success
          ? `✅ Email de prueba enviado exitosamente a ${testEmail}`
          : `❌ Error: ${data.error}`,
      })

      if (data.success) {
        setTestEmail("")
      }
    } catch (error) {
      setEmailResult({
        success: false,
        message: `❌ Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}`,
      })
    } finally {
      setIsSending(false)
    }
  }

  const runDebugCheck = async () => {
    setIsDebugging(true)
    setDebugResult(null)

    try {
      const url = debugEnrollmentId.trim() 
        ? `/api/debug-email?enrollment_id=${encodeURIComponent(debugEnrollmentId.trim())}`
        : "/api/debug-email"
        
      const response = await fetch(url, {
        method: "GET",
      })

      const data = await response.json()
      setDebugResult(data)
    } catch (error) {
      setDebugResult({
        error: "Error de conexión",
        message: error instanceof Error ? error.message : "Error desconocido"
      })
    } finally {
      setIsDebugging(false)
    }
  }

  const sendDebugEmail = async () => {
    if (!debugEnrollmentId.trim() || !testEmail.trim()) {
      setEmailResult({
        success: false,
        message: "Por favor ingresa un Enrollment ID y email válidos",
      })
      return
    }

    setIsSending(true)
    setEmailResult(null)

    try {
      const response = await fetch("/api/debug-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          enrollmentId: debugEnrollmentId.trim(), 
          testEmail: testEmail.trim() 
        }),
      })

      const data = await response.json()

      setEmailResult({
        success: data.success,
        message: data.success
          ? `✅ Email debug enviado exitosamente a ${testEmail}`
          : `❌ Error: ${data.message}`,
      })

      if (data.success) {
        console.log("📧 Debug email data:", data.data)
      }
    } catch (error) {
      setEmailResult({
        success: false,
        message: `❌ Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}`,
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="grid gap-6">
      {/* Panel de Verificación de Configuración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Verificar Configuración de Email
          </CardTitle>
          <CardDescription>
            Verifica que las credenciales de Gmail SMTP estén configuradas correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={checkEmailConfiguration} disabled={isChecking} className="w-full">
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verificar Configuración
              </>
            )}
          </Button>

          {configStatus && (
            <Alert className={configStatus.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {configStatus.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={configStatus.success ? "text-green-800" : "text-red-800"}>
                  {configStatus.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 mb-2">Variables de entorno requeridas:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <code>GMAIL_USER</code>: tu-email@gmail.com</li>
              <li>• <code>GMAIL_APP_PASSWORD</code>: contraseña de aplicación</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Panel de Debugging Avanzado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debugging Avanzado
          </CardTitle>
          <CardDescription>
            Verifica datos de enrollment específicos y configuración completa del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="debug-enrollment" className="text-sm font-medium">
              Enrollment ID (opcional):
            </label>
            <Input
              id="debug-enrollment"
              type="text"
              placeholder="ej: 12345-67890-abcdef"
              value={debugEnrollmentId}
              onChange={(e) => setDebugEnrollmentId(e.target.value)}
              className="w-full"
            />
          </div>

          <Button onClick={runDebugCheck} disabled={isDebugging} className="w-full">
            {isDebugging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ejecutando Debug...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Ejecutar Debug Check
              </>
            )}
          </Button>

          {debugResult && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Resultado del Debug:</h4>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-64">
                {JSON.stringify(debugResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Panel de Prueba de Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Email de Prueba
          </CardTitle>
          <CardDescription>
            Envía un email de confirmación de pago de prueba para verificar el funcionamiento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="test-email" className="text-sm font-medium">
              Email de destino:
            </label>
            <Input
              id="test-email"
              type="email"
              placeholder="ejemplo@gmail.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid gap-2">
            <Button onClick={sendTestEmail} disabled={isSending || !testEmail.trim()} className="w-full">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Email de Prueba (Datos Ficticios)
                </>
              )}
            </Button>

            {debugEnrollmentId.trim() && (
              <Button 
                onClick={sendDebugEmail} 
                disabled={isSending || !testEmail.trim() || !debugEnrollmentId.trim()} 
                variant="outline"
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Bug className="mr-2 h-4 w-4" />
                    Enviar Email Debug (Datos Reales)
                  </>
                )}
              </Button>
            )}
          </div>

          {emailResult && (
            <Alert className={emailResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {emailResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={emailResult.success ? "text-green-800" : "text-red-800"}>
                  {emailResult.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-blue-900 mb-2">📧 Tipos de email de prueba:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Datos Ficticios</strong>: Usa datos de prueba predefinidos</li>
              <li>• <strong>Datos Reales</strong>: Usa datos del Enrollment ID especificado</li>
              <li>• Ambos incluyen el template HTML completo y estético</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 