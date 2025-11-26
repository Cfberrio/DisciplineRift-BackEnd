'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, RefreshCw, Send, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'

interface DiagnosticStep {
  step: string
  status: 'pending' | 'success' | 'failed'
  message: string
  duration?: number
  error?: string
  code?: string
}

interface TestResult {
  success: boolean
  message: string
  diagnostics?: DiagnosticStep[]
  recommendation?: string
  totalDuration?: number
  errorCode?: string
}

interface SendTestResult {
  success: boolean
  message: string
  messageId?: string
  to?: string
  duration?: string
  recommendation?: string
  error?: string
}

interface UnsubscribeTestResult {
  success: boolean
  message: string
  email?: string
  result?: {
    emailExistedBefore: boolean
    emailExistsAfter: boolean
    wasSuccessfullyDeleted: boolean
  }
  steps?: Array<{
    step: number
    name: string
    status: string
    message: string
    data?: any
  }>
  recommendation?: string
}

export default function DiagnosticsPage() {
  const router = useRouter()
  
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  
  const [sending, setSending] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendResult, setSendResult] = useState<SendTestResult | null>(null)
  
  const [testingUnsubscribe, setTestingUnsubscribe] = useState(false)
  const [unsubscribeEmail, setUnsubscribeEmail] = useState('')
  const [unsubscribeResult, setUnsubscribeResult] = useState<UnsubscribeTestResult | null>(null)

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/email-marketing/test-relay-connection')
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error. Check console for details.',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    setSending(true)
    setSendResult(null)

    try {
      const response = await fetch('/api/email-marketing/send-test-relay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: testEmail }),
      })
      
      const data = await response.json()
      setSendResult(data)
    } catch (error) {
      setSendResult({
        success: false,
        message: 'Network error. Check console for details.',
      })
    } finally {
      setSending(false)
    }
  }

  const handleTestUnsubscribe = async () => {
    if (!unsubscribeEmail || !unsubscribeEmail.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    setTestingUnsubscribe(true)
    setUnsubscribeResult(null)

    try {
      const response = await fetch('/api/email-marketing/test-unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: unsubscribeEmail }),
      })
      
      const data = await response.json()
      setUnsubscribeResult(data)
    } catch (error) {
      setUnsubscribeResult({
        success: false,
        message: 'Network error. Check console for details.',
      })
    } finally {
      setTestingUnsubscribe(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">SMTP Relay Diagnostics</h1>
          <p className="text-muted-foreground">Test and verify your SMTP Relay configuration</p>
        </div>
      </div>

      {/* Connection Test Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>1. Test SMTP Relay Connection</CardTitle>
          <CardDescription>
            Verify that your SMTP Relay is configured and ready to send emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleTestConnection} 
            disabled={testing}
            className="w-full"
          >
            {testing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>

          {testResult && (
            <Alert className={testResult.success ? 'border-green-500' : 'border-red-500'}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                <div className="font-semibold mb-2">{testResult.message}</div>
                
                {testResult.recommendation && (
                  <div className="text-sm mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                    <strong>Recommendation:</strong> {testResult.recommendation}
                  </div>
                )}

                {testResult.diagnostics && testResult.diagnostics.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm font-semibold">Diagnostic Steps:</div>
                    {testResult.diagnostics.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2 p-2 rounded text-sm ${
                          step.status === 'success' ? 'bg-green-50' : 
                          step.status === 'failed' ? 'bg-red-50' : 'bg-gray-50'
                        }`}
                      >
                        {getStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="font-medium">{step.step}</div>
                          <div className="text-xs">{step.message}</div>
                          {step.error && (
                            <div className="text-xs text-red-600 mt-1">
                              Error: {step.error}
                              {step.code && ` (Code: ${step.code})`}
                            </div>
                          )}
                          {step.duration !== undefined && (
                            <div className="text-xs text-gray-500">Duration: {step.duration}ms</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {testResult.totalDuration && (
                  <div className="text-xs text-gray-600 mt-2">
                    Total duration: {(testResult.totalDuration / 1000).toFixed(2)}s
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Send Test Email Card */}
      <Card>
        <CardHeader>
          <CardTitle>2. Send Test Email</CardTitle>
          <CardDescription>
            Send a test email through SMTP Relay to verify end-to-end functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testEmail">Test Email Address</Label>
            <Input
              id="testEmail"
              type="email"
              placeholder="your-email@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              disabled={sending}
            />
            <p className="text-xs text-muted-foreground">
              Enter your email address to receive a test email
            </p>
          </div>

          <Button 
            onClick={handleSendTest} 
            disabled={sending || !testEmail}
            className="w-full"
          >
            {sending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending Test Email...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Test Email
              </>
            )}
          </Button>

          {sendResult && (
            <Alert className={sendResult.success ? 'border-green-500' : 'border-red-500'}>
              {sendResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                <div className="font-semibold mb-2">{sendResult.message}</div>
                
                {sendResult.messageId && (
                  <div className="text-xs text-gray-600 mb-2">
                    Message ID: {sendResult.messageId}
                  </div>
                )}

                {sendResult.to && (
                  <div className="text-xs text-gray-600 mb-2">
                    Sent to: {sendResult.to}
                  </div>
                )}

                {sendResult.duration && (
                  <div className="text-xs text-gray-600 mb-2">
                    Duration: {sendResult.duration}
                  </div>
                )}

                {sendResult.recommendation && (
                  <div className="text-sm mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <strong>Note:</strong> {sendResult.recommendation}
                  </div>
                )}

                {sendResult.error && (
                  <div className="text-sm text-red-600 mt-2">
                    {sendResult.error}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Unsubscribe Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>3. Test Unsubscribe Flow</CardTitle>
          <CardDescription>
            Test that the unsubscribe button correctly removes emails from Newsletter table
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="unsubscribeEmail">Email to Test</Label>
            <Input
              id="unsubscribeEmail"
              type="email"
              placeholder="test@example.com"
              value={unsubscribeEmail}
              onChange={(e) => setUnsubscribeEmail(e.target.value)}
              disabled={testingUnsubscribe}
            />
            <p className="text-xs text-muted-foreground">
              This will simulate the complete unsubscribe flow and check if the email is deleted from Newsletter table
            </p>
          </div>

          <Button 
            onClick={handleTestUnsubscribe} 
            disabled={testingUnsubscribe || !unsubscribeEmail}
            className="w-full"
          >
            {testingUnsubscribe ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing Unsubscribe...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Test Unsubscribe Flow
              </>
            )}
          </Button>

          {unsubscribeResult && (
            <Alert className={unsubscribeResult.success ? 'border-green-500' : 'border-red-500'}>
              {unsubscribeResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                <div className="font-semibold mb-2">{unsubscribeResult.message}</div>
                
                {unsubscribeResult.result && (
                  <div className="text-sm mb-3 space-y-1">
                    <div>Email existed before: {unsubscribeResult.result.emailExistedBefore ? '✓ Yes' : '✗ No'}</div>
                    <div>Email exists after: {unsubscribeResult.result.emailExistsAfter ? '✗ Yes (NOT deleted)' : '✓ No (deleted successfully)'}</div>
                    <div className={unsubscribeResult.result.wasSuccessfullyDeleted ? 'text-green-600 font-bold' : 'text-red-600'}>
                      Was deleted: {unsubscribeResult.result.wasSuccessfullyDeleted ? '✓ YES' : '✗ NO'}
                    </div>
                  </div>
                )}

                {unsubscribeResult.steps && unsubscribeResult.steps.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm font-semibold">Test Steps:</div>
                    {unsubscribeResult.steps.map((step, idx) => (
                      <div 
                        key={idx} 
                        className={`flex items-start gap-2 p-2 rounded text-sm ${
                          step.status === 'success' ? 'bg-green-50' : 
                          step.status === 'error' ? 'bg-red-50' : 
                          step.status === 'warning' ? 'bg-yellow-50' : 'bg-gray-50'
                        }`}
                      >
                        {getStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="font-medium">Step {step.step}: {step.name}</div>
                          <div className="text-xs">{step.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {unsubscribeResult.recommendation && (
                  <div className="text-sm mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <strong>Recommendation:</strong> {unsubscribeResult.recommendation}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>Error 421:</strong> SMTP Relay not yet active. Wait 30-60 minutes after enabling in Google Admin Console.</p>
          <p><strong>Error 535 (Authentication):</strong> Check that RELAY_PASS is a valid App Password from https://myaccount.google.com/apppasswords</p>
          <p><strong>Connection Timeout:</strong> Check your firewall or network settings allow outbound connections to smtp-relay.gmail.com:587</p>
          <p className="pt-2 border-t border-blue-300"><strong>Need help?</strong> Check the terminal logs for detailed error messages with prefix [RELAY-TEST]</p>
        </CardContent>
      </Card>
    </div>
  )
}


