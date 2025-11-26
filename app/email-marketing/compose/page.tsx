'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Send, TestTube, Eye, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface SendResult {
  success: boolean
  message: string
  statistics?: {
    total: number
    sent: number
    failed: number
  }
}

export default function ComposeNewsletterPage() {
  const router = useRouter()
  
  // Form state
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState('')
  const [textAlt, setTextAlt] = useState('')
  const [provider, setProvider] = useState<'gmail' | 'relay' | 'marketing'>('relay')
  
  // Hardcoded values
  const fromName = 'DisciplineRift'
  const fromEmail = 'luis@disciplinerift.com'
  
  // UI state
  const [showPreview, setShowPreview] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [testEmails, setTestEmails] = useState('')
  const [sending, setSending] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)
  const [sendResult, setSendResult] = useState<SendResult | null>(null)
  const [testResult, setTestResult] = useState<SendResult | null>(null)

  const validateForm = () => {
    if (!subject.trim()) return 'Subject is required'
    if (!html.trim()) return 'Email content is required'
    return null
  }

  const handlePreview = () => {
    const error = validateForm()
    if (error) {
      alert(error)
      return
    }
    setShowPreview(true)
  }

  const handleSendTest = async () => {
    const error = validateForm()
    if (error) {
      alert(error)
      return
    }

    const emails = testEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e)

    if (emails.length === 0) {
      alert('Please enter at least one test email address')
      return
    }

    setSendingTest(true)
    setTestResult(null)

    try {
      console.log('[NEWSLETTER] Sending test emails...', {
        emails,
        subject,
        provider,
        htmlLength: html.length,
      })

      const response = await fetch('/api/email-marketing/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          from_name: fromName,
          from_email: fromEmail,
          html,
          text_alt: textAlt,
          test_emails: emails,
          provider: provider,
        }),
      })

      console.log('[NEWSLETTER] Test response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[NEWSLETTER] Test HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }

        setTestResult({
          success: false,
          message: errorData.details 
            ? `${errorData.error || 'Failed to send test emails'}\n\n${errorData.details}` 
            : errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        })
        return
      }

      const data = await response.json()
      console.log('[NEWSLETTER] Test response data:', data)

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message,
          statistics: data.statistics,
        })
      } else {
        setTestResult({
          success: false,
          message: data.details 
            ? `${data.error || 'Failed to send test emails'}\n\n${data.details}` 
            : data.error || 'Failed to send test emails',
        })
      }
    } catch (error) {
      console.error('[NEWSLETTER] Test network error:', error)
      setTestResult({
        success: false,
        message: error instanceof Error 
          ? `Network error: ${error.message}` 
          : 'Network error. Please check your connection and try again.',
      })
    } finally {
      setSendingTest(false)
    }
  }

  const handleSendToAll = async () => {
    const error = validateForm()
    if (error) {
      alert(error)
      return
    }

    const confirmed = confirm(
      'Are you sure you want to send this newsletter to all subscribers? This action cannot be undone.'
    )

    if (!confirmed) return

    setSending(true)
    setSendResult(null)

    try {
      console.log('[NEWSLETTER] Starting send to all subscribers...', {
        subject,
        provider,
        htmlLength: html.length,
        hasPlaceholders: {
          viewInBrowser: html.includes('{VIEW_IN_BROWSER_URL}'),
          unsubscribe: html.includes('{UNSUBSCRIBE_URL}'),
        },
      })

      const response = await fetch('/api/email-marketing/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          from_name: fromName,
          from_email: fromEmail,
          html,
          text_alt: textAlt,
          provider: provider,
        }),
      })

      console.log('[NEWSLETTER] Response status:', response.status, response.statusText)

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[NEWSLETTER] HTTP Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}`, details: errorText }
        }

        const errorMessage = errorData.details 
          ? `${errorData.error || 'Failed to send newsletter'}\n\n${errorData.details}` 
          : errorData.error || `HTTP ${response.status}: ${response.statusText}`
        
        setSendResult({
          success: false,
          message: errorMessage,
        })
        return
      }

      const data = await response.json()
      console.log('[NEWSLETTER] Response data:', data)

      if (data.success) {
        setSendResult({
          success: true,
          message: data.message,
          statistics: data.statistics,
        })
      } else {
        // Show detailed error message including Gmail limit info
        const errorMessage = data.details 
          ? `${data.error || 'Failed to send newsletter'}\n\n${data.details}` 
          : data.error || 'Failed to send newsletter'
        
        console.error('[NEWSLETTER] Send failed:', {
          error: data.error,
          details: data.details,
          errors: data.errors,
        })
        
        setSendResult({
          success: false,
          message: errorMessage,
        })
      }
    } catch (error) {
      console.error('[NEWSLETTER] Network/Parse error:', error)
      const errorMessage = error instanceof Error 
        ? `Network error: ${error.message}` 
        : 'Network error. Please check your connection and try again.'
      
      setSendResult({
        success: false,
        message: errorMessage,
      })
    } finally {
      setSending(false)
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
          <h1 className="text-3xl font-bold">Compose Newsletter</h1>
          <p className="text-muted-foreground">Create and send your email campaign</p>
        </div>
      </div>

      {sendResult && (
        <Alert className={`mb-6 ${sendResult.success ? 'border-green-500' : 'border-red-500'}`}>
          {sendResult.success ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>
            <div className="font-semibold mb-1">{sendResult.message}</div>
            {sendResult.statistics && (
              <div className="text-sm">
                Total: {sendResult.statistics.total} | Sent: {sendResult.statistics.sent} | Failed: {sendResult.statistics.failed}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Newsletter Details</CardTitle>
          <CardDescription>Fill in the details for your email campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject *</Label>
            <Input
              id="subject"
              placeholder="e.g., Important Update from DisciplineRift"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider">SMTP Provider *</Label>
            <Select value={provider} onValueChange={(value: 'gmail' | 'relay' | 'marketing') => setProvider(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gmail">Gmail SMTP (≤500 emails/day)</SelectItem>
                <SelectItem value="relay">Workspace Relay (bulk sending)</SelectItem>
                <SelectItem value="marketing">Marketing SMTP (custom)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose the email provider for sending newsletters
            </p>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-semibold mb-1">Email Configuration</p>
            <p className="text-muted-foreground">
              All emails will be sent from <strong>DisciplineRift</strong> &lt;luis@disciplinerift.com&gt; using {provider === 'gmail' ? 'Gmail SMTP' : provider === 'relay' ? 'Workspace Relay' : 'Marketing SMTP'}.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {provider === 'relay' && 'Workspace Relay recommended for bulk sending (1500+ emails)'}
              {provider === 'gmail' && 'Gmail SMTP limited to 500-2000 emails/day'}
              {provider === 'marketing' && 'Custom Marketing SMTP for high-volume campaigns'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="html">Email Content (HTML) *</Label>
            <Textarea
              id="html"
              placeholder="Enter your email HTML content here..."
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              rows={12}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              You can use HTML tags for formatting. The unsubscribe link will be added automatically.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="textAlt">Plain Text Alternative (Optional)</Label>
            <Textarea
              id="textAlt"
              placeholder="Plain text version of your email..."
              value={textAlt}
              onChange={(e) => setTextAlt(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              If left empty, will be auto-generated from HTML content.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handlePreview}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowTestDialog(true)}
            >
              <TestTube className="mr-2 h-4 w-4" />
              Send Test
            </Button>

            <Button
              onClick={handleSendToAll}
              disabled={sending}
              className="ml-auto"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to All Subscribers
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
            <DialogDescription>
              This is how your email will look to subscribers
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white">
            <div className="mb-4 border-b pb-4">
              <div className="text-sm text-muted-foreground mb-1">Subject:</div>
              <div className="font-semibold">{subject || '(No subject)'}</div>
              <div className="text-sm text-muted-foreground mt-2">
                From: DisciplineRift &lt;info@disciplinerift.com&gt;
              </div>
            </div>
            <div dangerouslySetInnerHTML={{ __html: html || '<p class="text-muted-foreground">(No content)</p>' }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Email Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Emails</DialogTitle>
            <DialogDescription>
              Enter email addresses to send test emails (comma-separated)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testEmails">Test Email Addresses</Label>
              <Textarea
                id="testEmails"
                placeholder="test1@example.com, test2@example.com"
                value={testEmails}
                onChange={(e) => setTestEmails(e.target.value)}
                rows={3}
              />
            </div>

            {testResult && (
              <Alert className={testResult.success ? 'border-green-500' : 'border-red-500'}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  <div className="font-semibold">{testResult.message}</div>
                  {testResult.statistics && (
                    <div className="text-sm mt-1">
                      Sent: {testResult.statistics.sent} | Failed: {testResult.statistics.failed}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTest} disabled={sendingTest}>
              {sendingTest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

