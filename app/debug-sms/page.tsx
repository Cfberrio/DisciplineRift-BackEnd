"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/sidebar"
import { AlertCircle, CheckCircle, Phone, Send } from "lucide-react"

export default function DebugSMSPage() {
  const [testPhone, setTestPhone] = useState("")
  const [testMessage, setTestMessage] = useState("Hello! This is a test SMS from your volleyball system. 🏐")
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [configTest, setConfigTest] = useState<any>(null)
  const [messageId, setMessageId] = useState("")
  const [statusCheck, setStatusCheck] = useState<any>(null)
  const [optimizedResults, setOptimizedResults] = useState<any>(null)
  const [a2pStatus, setA2pStatus] = useState<any>(null)

  const testSMSConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/marketing/test-sms-config')
      const result = await response.json()
      setConfigTest(result)
      console.log('[DEBUG] SMS Config Test Result:', result)
    } catch (error) {
      console.error('[DEBUG] Config test failed:', error)
      setConfigTest({ success: false, error: 'Test failed' })
    } finally {
      setLoading(false)
    }
  }

  const sendTestSMS = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      alert('Please enter both phone number and message')
      return
    }

    try {
      setLoading(true)
      setResults(null)

      const response = await fetch('/api/debug/send-single-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage
        })
      })

      const result = await response.json()
      setResults(result)
      console.log('[DEBUG] Single SMS Test Result:', result)
    } catch (error) {
      console.error('[DEBUG] SMS test failed:', error)
      setResults({ success: false, error: 'Test failed', details: error })
    } finally {
      setLoading(false)
    }
  }

  const checkMessageStatus = async () => {
    if (!messageId.trim()) {
      alert('Please enter a message ID')
      return
    }

    try {
      setLoading(true)
      setStatusCheck(null)

      const response = await fetch('/api/debug/check-sms-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: messageId })
      })

      const result = await response.json()
      setStatusCheck(result)
      console.log('[DEBUG] Message Status Check Result:', result)
    } catch (error) {
      console.error('[DEBUG] Status check failed:', error)
      setStatusCheck({ success: false, error: 'Status check failed', details: error })
    } finally {
      setLoading(false)
    }
  }

  const sendOptimizedSMS = async () => {
    if (!testPhone.trim() || !testMessage.trim()) {
      alert('Please enter both phone number and message')
      return
    }

    try {
      setLoading(true)
      setOptimizedResults(null)

      const response = await fetch('/api/debug/send-optimized-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage
        })
      })

      const result = await response.json()
      setOptimizedResults(result)
      console.log('[DEBUG] Optimized SMS Result:', result)
    } catch (error) {
      console.error('[DEBUG] Optimized SMS test failed:', error)
      setOptimizedResults({ success: false, error: 'Test failed', details: error })
    } finally {
      setLoading(false)
    }
  }

  const checkA2PStatus = async () => {
    try {
      setLoading(true)
      setA2pStatus(null)

      const response = await fetch('/api/debug/check-a2p-status')
      const result = await response.json()
      setA2pStatus(result)
      console.log('[DEBUG] A2P Status Check Result:', result)
    } catch (error) {
      console.error('[DEBUG] A2P status check failed:', error)
      setA2pStatus({ success: false, error: 'A2P status check failed', details: error })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">SMS Debug Console</h1>
                <p className="text-gray-600 mt-1">
                  Test and debug SMS configuration and sending
                </p>
              </div>

              {/* Configuration Test */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    SMS Configuration Test
                  </CardTitle>
                  <CardDescription>
                    Test your Twilio configuration and environment variables
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={testSMSConfig} disabled={loading}>
                    Test SMS Configuration
                  </Button>

                  {configTest && (
                    <Alert className={configTest.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      {configTest.success ? 
                        <CheckCircle className="h-4 w-4 text-green-600" /> : 
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      }
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className={configTest.success ? "text-green-800" : "text-red-800"}>
                            {configTest.success ? "✅ Configuration OK" : "❌ Configuration Failed"}
                          </p>
                          {configTest.envCheck && (
                            <div className="space-y-1 text-sm">
                              <p>TWILIO_ACCOUNT_SID: {configTest.envCheck.hasTwilioSid ? "✅" : "❌"}</p>
                              <p>TWILIO_AUTH_TOKEN: {configTest.envCheck.hasTwilioToken ? "✅" : "❌"}</p>
                              <p>TWILIO_PHONE_NUMBER: {configTest.envCheck.hasTwilioPhone ? "✅" : "❌"}</p>
                              {configTest.envCheck.twilioPhone && (
                                <p>Phone: <Badge>{configTest.envCheck.twilioPhone}</Badge></p>
                              )}
                            </div>
                          )}
                          {configTest.error && (
                            <p className="text-red-800 text-sm">Error: {configTest.error}</p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
               </Card>

              {/* A2P 10DLC Status Check - Critical for Error 30034 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    A2P 10DLC Registration Status (Error 30034 Fix)
                  </CardTitle>
                  <CardDescription>
                    Check if your number is registered for A2P 10DLC (required to fix error 30034)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="font-medium text-red-800">🚨 Error 30034 Detected</p>
                    <p className="text-red-700 text-sm mt-1">
                      This error means your Twilio number is NOT registered for A2P 10DLC. Since August 2023, 
                      all SMS from unregistered numbers are automatically blocked by Twilio.
                    </p>
                  </div>

                  <Button onClick={checkA2PStatus} disabled={loading}>
                    Check A2P Registration Status
                  </Button>

                  {a2pStatus && (
                    <Alert className={a2pStatus.success ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}>
                      {a2pStatus.success ? 
                        <CheckCircle className="h-4 w-4 text-blue-600" /> : 
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      }
                      <AlertDescription>
                        <div className="space-y-3">
                          {a2pStatus.success ? (
                            <>
                              <div>
                                <p className="text-blue-800 font-medium">Phone Number Information:</p>
                                <div className="text-sm space-y-1 mt-2">
                                  <p><strong>Number:</strong> {a2pStatus.phoneNumberInfo.phoneNumber}</p>
                                  <p><strong>SMS Enabled:</strong> {a2pStatus.phoneNumberInfo.smsEnabled ? '✅' : '❌'}</p>
                                  <p><strong>Status:</strong> {a2pStatus.phoneNumberInfo.status}</p>
                                  <p><strong>Messaging Service:</strong> {a2pStatus.phoneNumberInfo.messagingServiceSid || 'None'}</p>
                                </div>
                              </div>

                              <div>
                                <p className="text-blue-800 font-medium">A2P Campaign Status:</p>
                                <div className="text-sm space-y-1 mt-2">
                                  {a2pStatus.a2pCampaigns.length > 0 ? (
                                    a2pStatus.a2pCampaigns.map((campaign: any, index: number) => (
                                      <div key={index} className="bg-white p-2 rounded border">
                                        <p><strong>Campaign:</strong> {campaign.friendlyName || campaign.sid}</p>
                                        <p><strong>Status:</strong> 
                                          <Badge variant={campaign.registrationStatus === 'VERIFIED' ? 'default' : 'destructive'} className="ml-2">
                                            {campaign.registrationStatus}
                                          </Badge>
                                        </p>
                                        <p><strong>Business:</strong> {campaign.businessName || 'Not specified'}</p>
                                        <p><strong>Type:</strong> {campaign.campaignType}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-red-600 font-medium">❌ No A2P campaigns found</p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-blue-800 font-medium">Analysis & Recommendations:</p>
                                <ul className="text-sm space-y-1 mt-2 list-disc ml-4">
                                  {a2pStatus.analysis.recommendations.map((rec: string, index: number) => (
                                    <li key={index} className={rec.includes('❌') ? 'text-red-600 font-medium' : ''}>{rec}</li>
                                  ))}
                                </ul>
                              </div>

                              {a2pStatus.analysis.requiresA2PRegistration && (
                                <div className="bg-yellow-100 p-3 rounded border border-yellow-300 mt-3">
                                  <p className="font-medium text-yellow-800">⚠️ Action Required: A2P Registration</p>
                                  <div className="text-yellow-700 text-sm mt-2 space-y-1">
                                    <p><strong>Next Steps:</strong></p>
                                    <ol className="list-decimal ml-4 space-y-1">
                                      <li>Go to <a href="https://console.twilio.com/us1/develop/sms/try-it-out/a2p-registration" target="_blank" className="underline font-medium">Twilio A2P Registration</a></li>
                                      <li>Register your business and create an A2P campaign</li>
                                      <li>Associate your phone number (+{a2pStatus.phoneNumberInfo.phoneNumber?.replace('+', '')}) with the campaign</li>
                                      <li>Wait for campaign approval (usually 1-7 business days)</li>
                                      <li>Once approved, SMS will work normally</li>
                                    </ol>
                                    <p className="mt-2"><strong>Cost:</strong> Registration typically costs $4/month per campaign</p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-red-800">
                              {a2pStatus.error}: {a2pStatus.details}
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

               {/* Single SMS Test */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Send Test SMS
                  </CardTitle>
                  <CardDescription>
                    Send a single SMS to test the complete flow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-phone">Test Phone Number</Label>
                    <Input
                      id="test-phone"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      placeholder="+1234567890 (must be verified in Twilio Trial)"
                    />
                    <p className="text-xs text-muted-foreground">
                      ⚠️ For Twilio Trial accounts, this number must be verified in your Twilio Console
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test-message">Test Message</Label>
                    <Textarea
                      id="test-message"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Enter your test message..."
                      className="min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Characters: {testMessage.length} / 160
                    </p>
                  </div>

                  <Button onClick={sendTestSMS} disabled={loading || !testPhone.trim() || !testMessage.trim()}>
                    {loading ? "Sending..." : "Send Test SMS"}
                  </Button>

                  {results && (
                    <Alert className={results.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      {results.success ? 
                        <CheckCircle className="h-4 w-4 text-green-600" /> : 
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      }
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className={results.success ? "text-green-800" : "text-red-800"}>
                            {results.success ? "✅ SMS Sent Successfully" : "❌ SMS Failed"}
                          </p>
                          
                          {results.messageId && (
                            <p className="text-sm">Message ID: <Badge>{results.messageId}</Badge></p>
                          )}
                          
                          {results.error && (
                            <div className="text-red-800 text-sm space-y-1">
                              <p><strong>Error:</strong> {results.error}</p>
                              {results.details && (
                                <pre className="bg-red-100 p-2 rounded text-xs overflow-auto">
                                  {JSON.stringify(results.details, null, 2)}
                                </pre>
                              )}
                            </div>
                          )}

                          {results.twilioError && (
                            <div className="text-red-800 text-sm">
                              <p><strong>Twilio Error:</strong> {results.twilioError.message}</p>
                              <p><strong>Code:</strong> {results.twilioError.code}</p>
                              {results.twilioError.moreInfo && (
                                <p><strong>More Info:</strong> <a href={results.twilioError.moreInfo} target="_blank" className="underline">{results.twilioError.moreInfo}</a></p>
                              )}
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Message Status Check */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Check Message Status
                  </CardTitle>
                  <CardDescription>
                    Check the delivery status of a specific SMS using its Message ID
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message-id">Message ID (SID)</Label>
                    <Input
                      id="message-id"
                      value={messageId}
                      onChange={(e) => setMessageId(e.target.value)}
                      placeholder="SM27167920b968558a3853be09c8c5061c"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the Message ID from the SMS logs (starts with "SM")
                    </p>
                  </div>

                  <Button onClick={checkMessageStatus} disabled={loading || !messageId.trim()}>
                    {loading ? "Checking..." : "Check Status"}
                  </Button>

                  {statusCheck && (
                    <Alert className={statusCheck.success ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}>
                      {statusCheck.success ? 
                        <CheckCircle className="h-4 w-4 text-blue-600" /> : 
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      }
                      <AlertDescription>
                        <div className="space-y-2">
                          {statusCheck.success ? (
                            <div className="space-y-2">
                              <p className="text-blue-800 font-medium">Message Status Details:</p>
                              <div className="text-sm space-y-1">
                                <p><strong>Status:</strong> 
                                  <Badge variant={
                                    statusCheck.messageStatus.status === 'delivered' ? 'default' :
                                    statusCheck.messageStatus.status === 'sent' ? 'secondary' :
                                    statusCheck.messageStatus.status === 'failed' ? 'destructive' :
                                    'outline'
                                  } className="ml-2">
                                    {statusCheck.messageStatus.status}
                                  </Badge>
                                </p>
                                <p><strong>To:</strong> {statusCheck.messageStatus.to}</p>
                                <p><strong>From:</strong> {statusCheck.messageStatus.from}</p>
                                <p><strong>Message:</strong> {statusCheck.messageStatus.body}</p>
                                <p><strong>Date Created:</strong> {statusCheck.messageStatus.dateCreated}</p>
                                <p><strong>Date Sent:</strong> {statusCheck.messageStatus.dateSent}</p>
                                {statusCheck.messageStatus.price && (
                                  <p><strong>Cost:</strong> {statusCheck.messageStatus.price} {statusCheck.messageStatus.priceUnit}</p>
                                )}
                                {statusCheck.messageStatus.errorCode && (
                                  <div className="bg-red-100 p-2 rounded">
                                    <p><strong>Error Code:</strong> {statusCheck.messageStatus.errorCode}</p>
                                    <p><strong>Error Message:</strong> {statusCheck.messageStatus.errorMessage}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-red-800">
                              {statusCheck.error}: {statusCheck.details}
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Optimized SMS Test for Undelivered Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-green-600" />
                    Send Optimized SMS (Fix Undelivered)
                  </CardTitle>
                  <CardDescription>
                    Send SMS with optimizations to fix "undelivered" status issues
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="font-medium text-green-800">🔧 Delivery Optimizations:</p>
                    <ul className="text-green-700 text-sm space-y-1 mt-1 list-disc ml-4">
                      <li>Removes emojis (🏐) and special characters</li>
                      <li>Limits message to 160 characters</li>
                      <li>Sets higher price limit and validity period</li>
                      <li>Requests delivery feedback from carrier</li>
                      <li>Normalizes phone number format</li>
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={sendOptimizedSMS} 
                      disabled={loading || !testPhone.trim() || !testMessage.trim()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading ? "Sending..." : "Send Optimized SMS"}
                    </Button>
                    
                    <Button 
                      onClick={() => setTestMessage("Hello! This is a test message from your volleyball system. Thank you!")}
                      variant="outline"
                      size="sm"
                    >
                      Use Clean Message
                    </Button>
                  </div>

                  {optimizedResults && (
                    <Alert className={optimizedResults.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      {optimizedResults.success ? 
                        <CheckCircle className="h-4 w-4 text-green-600" /> : 
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      }
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className={optimizedResults.success ? "text-green-800" : "text-red-800"}>
                            {optimizedResults.success ? "✅ Optimized SMS Sent" : "❌ Optimized SMS Failed"}
                          </p>
                          
                          {optimizedResults.messageId && (
                            <p className="text-sm">Message ID: <Badge>{optimizedResults.messageId}</Badge></p>
                          )}

                          {optimizedResults.optimizedMessage && optimizedResults.originalMessage !== optimizedResults.optimizedMessage && (
                            <div className="text-sm space-y-1">
                              <p><strong>Original:</strong></p>
                              <p className="bg-red-100 p-2 rounded text-xs">{optimizedResults.originalMessage}</p>
                              <p><strong>Optimized:</strong></p>
                              <p className="bg-green-100 p-2 rounded text-xs">{optimizedResults.optimizedMessage}</p>
                            </div>
                          )}

                          {optimizedResults.optimizations && (
                            <div className="text-sm">
                              <p><strong>Applied Optimizations:</strong></p>
                              <ul className="list-disc ml-4 space-y-1">
                                {optimizedResults.optimizations.map((opt: string, index: number) => (
                                  <li key={index}>{opt}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {optimizedResults.recommendations && (
                            <div className="text-sm">
                              <p><strong>Next Steps:</strong></p>
                              <ul className="list-disc ml-4 space-y-1">
                                {optimizedResults.recommendations.map((rec: string, index: number) => (
                                  <li key={index}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {optimizedResults.error && (
                            <div className="text-red-800 text-sm space-y-1">
                              <p><strong>Error:</strong> {optimizedResults.error}</p>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

               {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Troubleshooting Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium">Trial Account Limitations:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li>Can only send to verified phone numbers</li>
                      <li>Daily sending limits apply</li>
                      <li>Numbers must be in E.164 format (+1234567890)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium">Common Errors:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li><strong>21211:</strong> Invalid 'To' phone number (not verified in Trial)</li>
                      <li><strong>21614:</strong> 'To' number is not a valid mobile number</li>
                      <li><strong>21408:</strong> Permission to send SMS not enabled</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
