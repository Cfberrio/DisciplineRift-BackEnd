"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

interface CancellationRecipient {
  parentEmail: string
  parentName: string
  teamName: string
  schoolName: string
  idempotencyKey: string
}

interface CancellationResult {
  success: boolean
  message: string
  summary?: {
    totalFound: number
    attempted: number
    sent: number
    failed: number
  }
  recipients?: CancellationRecipient[]
  sampleEmail?: {
    subject: string
    recipient: {
      parentEmail: string
      parentName: string
      teamName: string
      schoolName: string
    }
    htmlPreview: string
  }
  results?: Array<{
    parentEmail: string
    parentName: string
    teamName: string
    schoolName: string
    success: boolean
    messageId?: string
    error?: string
    idempotencyKey: string
  }>
  testEmail?: string
}

export default function CancellationManager() {
  const [isLoading, setIsLoading] = useState(false)
  const [isDryRun, setIsDryRun] = useState(true)
  const [limit, setLimit] = useState<string>("")
  const [testEmail, setTestEmail] = useState<string>("")
  const [result, setResult] = useState<CancellationResult | null>(null)
  const [error, setError] = useState<string>("")

  const sendCancellations = async () => {
    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_API_KEY || 'admin-cancellations-2024'
      
      const requestBody = {
        dryRun: isDryRun,
        ...(limit && { limit: parseInt(limit) }),
        ...(testEmail && { testEmail })
      }

      console.log('🚀 Enviando solicitud:', requestBody)

      const response = await fetch('/api/admin/send-cancellations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}`)
      }

      setResult(data)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      console.error('❌ Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (success: boolean) => {
    return success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📧 Sistema de Cancelaciones</CardTitle>
          <CardDescription>
            Envío automático de emails de cancelación para equipos inactivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="dry-run"
                  checked={isDryRun}
                  onCheckedChange={setIsDryRun}
                />
                <Label htmlFor="dry-run">Modo Dry Run (solo vista previa)</Label>
              </div>
              {isDryRun && (
                <p className="text-sm text-muted-foreground">
                  ℹ️ En modo dry run, no se envían emails reales
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Límite de destinatarios (opcional)</Label>
              <Input
                id="limit"
                type="number"
                placeholder="Ej: 5"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-email">Email de prueba (opcional)</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Si se especifica, todos los emails se redirigirán a esta dirección
            </p>
          </div>

          <Button 
            onClick={sendCancellations} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isDryRun ? 'Ejecutando vista previa...' : 'Enviando emails...'}
              </>
            ) : (
              isDryRun ? '🔍 Ejecutar Vista Previa' : '📧 Enviar Emails de Cancelación'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            ❌ {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Resultados */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>
              {result.success ? '✅ Resultados' : '❌ Error'}
            </CardTitle>
            <CardDescription>
              {result.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Resumen */}
            {result.summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{result.summary.totalFound}</div>
                  <div className="text-sm text-muted-foreground">Total encontrado</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{result.summary.attempted || 0}</div>
                  <div className="text-sm text-muted-foreground">Intentados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.summary.sent || 0}</div>
                  <div className="text-sm text-muted-foreground">Enviados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{result.summary.failed || 0}</div>
                  <div className="text-sm text-muted-foreground">Fallidos</div>
                </div>
              </div>
            )}

            {/* Destinatarios (Dry Run) */}
            {result.recipients && result.recipients.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">📋 Destinatarios ({result.recipients.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.recipients.map((recipient, index) => (
                    <div key={recipient.idempotencyKey} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{recipient.parentName}</div>
                          <div className="text-sm text-muted-foreground">{recipient.parentEmail}</div>
                          <div className="text-sm">
                            <span className="font-medium">Team:</span> {recipient.teamName}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Escuela:</span> {recipient.schoolName}
                          </div>
                        </div>
                        <Badge variant="outline">#{index + 1}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Muestra de Email */}
            {result.sampleEmail && (
              <div>
                <h4 className="font-semibold mb-2">📧 Muestra de Email</h4>
                <div className="p-3 border rounded-lg space-y-2">
                  <div><span className="font-medium">Asunto:</span> {result.sampleEmail.subject}</div>
                  <div><span className="font-medium">Para:</span> {result.sampleEmail.recipient?.parentName} ({result.sampleEmail.recipient?.parentEmail})</div>
                  <div><span className="font-medium">Team:</span> {result.sampleEmail.recipient?.teamName}</div>
                  <div><span className="font-medium">Escuela:</span> {result.sampleEmail.recipient?.schoolName}</div>
                  <Separator />
                  <div>
                    <span className="font-medium">Vista previa HTML:</span>
                    <Textarea 
                      value={result.sampleEmail.htmlPreview} 
                      readOnly 
                      className="mt-1 font-mono text-xs"
                      rows={5}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Resultados de Envío */}
            {result.results && result.results.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">📤 Resultados de Envío ({result.results.length})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.results.map((emailResult, index) => (
                    <div key={emailResult.idempotencyKey} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{emailResult.parentName}</div>
                          <div className="text-sm text-muted-foreground">{emailResult.parentEmail}</div>
                          <div className="text-sm">
                            <span className="font-medium">Team:</span> {emailResult.teamName}
                          </div>
                          {emailResult.messageId && (
                            <div className="text-xs text-muted-foreground">
                              ID: {emailResult.messageId}
                            </div>
                          )}
                          {emailResult.error && (
                            <div className="text-xs text-red-600">
                              Error: {emailResult.error}
                            </div>
                          )}
                        </div>
                        <Badge className={getStatusColor(emailResult.success)}>
                          {emailResult.success ? 'Enviado' : 'Error'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Email de prueba info */}
            {result.testEmail && (
              <Alert>
                <AlertDescription>
                  🧪 Modo de prueba: Todos los emails fueron redirigidos a {result.testEmail}
                </AlertDescription>
              </Alert>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  )
}