"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TeamSelector } from "./team-selector"
import { ParentSelector } from "./parent-selector"
import { Mail, Send, Users, FileText, AlertCircle, CheckCircle, Loader2, Upload, File, X, MessageSquare, Smartphone, AtSign } from "lucide-react"

interface EmailTemplate {
  id: number
  name: string
  subject: string
  content: string
  category: string
}

// Sample templates in English with database variables
const sampleTemplates: EmailTemplate[] = [
  {
    id: 1,
    name: "Training Reminder",
    subject: "Reminder: {TEAM_NAME} Training Session for {STUDENT_NAME}",
    content: `
      <h2>Hello {PARENT_NAME},</h2>
      <p>This is a reminder that <strong>{STUDENT_NAME}</strong> (Grade: {STUDENT_GRADE}) has a training session with <strong>{TEAM_NAME}</strong>.</p>
      <p><strong>Training Details:</strong></p>
      <ul>
        <li>Team: {TEAM_NAME}</li>
        <li>Coach: {COACH_NAME}</li>
        <li>Location: {SCHOOL_LOCATION}</li>
        <li>School: {SCHOOL_NAME}</li>
        <li>Team Fee: {TEAM_PRICE}</li>
      </ul>
      <p><strong>Team Description:</strong> {TEAM_DESCRIPTION}</p>
      <p>Don't forget to bring all necessary equipment!</p>
      <p>If you have any questions, please contact us at your convenience.</p>
      <p>Best regards,<br>The {SCHOOL_NAME} Team</p>
    `,
    category: "Reminder"
  },
  {
    id: 2,
    name: "General Team Information",
    subject: "Important information about {TEAM_NAME} - {STUDENT_NAME}",
    content: `
      <h2>Dear {PARENT_NAME},</h2>
      <p>We wanted to share some important information about <strong>{STUDENT_NAME}'s</strong> team: <strong>{TEAM_NAME}</strong>.</p>
      
      <h3>Team Details:</h3>
      <ul>
        <li><strong>Team:</strong> {TEAM_NAME}</li>
        <li><strong>Coach:</strong> {COACH_NAME}</li>
        <li><strong>School:</strong> {SCHOOL_NAME}</li>
        <li><strong>Location:</strong> {SCHOOL_LOCATION}</li>
        <li><strong>Fee:</strong> {TEAM_PRICE}</li>
      </ul>
      
      <h3>About the Team:</h3>
      <p>{TEAM_DESCRIPTION}</p>
      
      <h3>Student Information:</h3>
      <ul>
        <li><strong>Student:</strong> {STUDENT_NAME}</li>
        <li><strong>Grade:</strong> {STUDENT_GRADE}</li>
      </ul>
      
      <p>We look forward to a great season ahead!</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>The {SCHOOL_NAME} Team</p>
    `,
    category: "Information"
  }
]

interface EmailCampaignProps {
  onClose?: () => void
}

export function EmailCampaign({ onClose }: EmailCampaignProps) {
  // Estado para seleccionar tipo de campaña
  const [campaignType, setCampaignType] = useState<'email' | 'sms' | null>(null)
  
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [selectedParents, setSelectedParents] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [customSubject, setCustomSubject] = useState("")
  const [customContent, setCustomContent] = useState("")
  const [isCustomTemplate, setIsCustomTemplate] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle")
  const [sendMessage, setSendMessage] = useState("")
  
  // Template upload states
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null)
  const [uploadedPngTemplate, setUploadedPngTemplate] = useState<File | null>(null)
  const [pdfContent, setPdfContent] = useState<string>("")
  const [isExtractingPdf, setIsExtractingPdf] = useState(false)
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  
  // SMS states
  const [smsMessage, setSmsMessage] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pngInputRef = useRef<HTMLInputElement>(null)

  const selectedTemplateData = selectedTemplate 
    ? sampleTemplates.find(t => t.id === selectedTemplate)
    : null

  const handleTemplateChange = (value: string) => {
    if (value === "html") {
      setIsHtmlMode(true)
      setIsCustomTemplate(false)
      setSelectedTemplate(null)
      setUploadedPdf(null)
      setUploadedPngTemplate(null)
      setPdfContent("")
      setCustomSubject("")
      setHtmlContent("")
    } else if (value === "custom") {
      setIsCustomTemplate(true)
      setIsHtmlMode(false)
      setSelectedTemplate(null)
      setUploadedPdf(null)
      setUploadedPngTemplate(null)
      setPdfContent("")
    } else {
      const templateId = parseInt(value)
      if (!isNaN(templateId)) {
        setSelectedTemplate(templateId)
        setIsCustomTemplate(false)
        setIsHtmlMode(false)
        setUploadedPdf(null)
        setUploadedPngTemplate(null)
        setPdfContent("")
        
        const template = sampleTemplates.find(t => t.id === templateId)
        if (template) {
          setCustomSubject(template.subject)
          setCustomContent(template.content)
        }
      }
    }
  }

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || file.type !== 'application/pdf') {
      setSendStatus("error")
      setSendMessage("Please select a valid PDF file")
      return
    }

    setUploadedPdf(file)
    setIsExtractingPdf(true)
    setSendStatus("idle")
    
    try {
      const formData = new FormData()
      formData.append('pdf', file)
      
      const response = await fetch('/api/marketing/extract-pdf', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to extract text from PDF')
      }
      
      const result = await response.json()
      const extractedText = result.text || result.content || ""
      
      setPdfContent(extractedText)
      setCustomContent(extractedText)
      setCustomSubject("Content from uploaded PDF")
      setSendStatus("success")
      setSendMessage("PDF content extracted successfully")
      
    } catch (error) {
      setSendStatus("error")
      setSendMessage("Failed to extract text from PDF")
      console.error('Error extracting PDF:', error)
    } finally {
      setIsExtractingPdf(false)
    }
  }

  const handlePngUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      setSendStatus("error")
      setSendMessage("Please select a valid image file (PNG, JPG, etc.)")
      return
    }

    setUploadedPngTemplate(file)
    setCustomSubject("Custom Template Email")
    setCustomContent("Your message content will be overlaid on the template image.")
    setSendStatus("success")
    setSendMessage("Template image uploaded successfully")
  }

  const clearPdfUpload = () => {
    setUploadedPdf(null)
    setPdfContent("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const clearPngUpload = () => {
    setUploadedPngTemplate(null)
    if (pngInputRef.current) {
      pngInputRef.current.value = ""
    }
  }

  const handleSendSMS = async () => {
    if (!selectedTeamId || selectedParents.length === 0) {
      setSendStatus("error")
      setSendMessage("You must select a team and at least one parent")
      return
    }

    if (!smsMessage.trim()) {
      setSendStatus("error")
      setSendMessage("You must provide a message for the SMS")
      return
    }

    try {
      setIsSending(true)
      setSendStatus("idle")
      
      const requestPayload = {
        teamId: selectedTeamId,
        parentIds: selectedParents,
        message: smsMessage
      }
      
      console.log('[CLIENT] Sending SMS request:', {
        teamId: requestPayload.teamId,
        parentCount: requestPayload.parentIds?.length,
        parentIds: requestPayload.parentIds,
        hasMessage: !!requestPayload.message,
        messageLength: requestPayload.message?.length,
        message: requestPayload.message.substring(0, 100) + '...'
      })
      
      const response = await fetch("/api/marketing/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        let errorMessage = `Server returned ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
          console.error('[CLIENT] Server error details:', errorData)
        } catch (parseError) {
          console.error('[CLIENT] Could not parse error response:', parseError)
        }
        throw new Error(`Failed to send SMS: ${errorMessage}`)
      }

      const result = await response.json()
      console.log('[CLIENT] SMS send successful:', {
        success: result.success,
        message: result.message,
        statistics: result.statistics,
        totalResults: result.results?.length,
        successfulSMS: result.results?.filter((r: any) => r.success).length,
        failedSMS: result.results?.filter((r: any) => !r.success).length,
        results: result.results
      })
      
      setSendStatus("success")
      const successCount = result.results?.filter((r: any) => r.success).length || 0
      const failCount = result.results?.filter((r: any) => !r.success).length || 0
      const totalAttempted = result.results?.length || 0
      
      if (failCount > 0) {
        setSendMessage(`SMS Campaign completed: ${successCount} sent successfully, ${failCount} failed out of ${totalAttempted} attempts. Check console for details.`)
      } else {
        setSendMessage(`SMS sent successfully to ${successCount} parents! You can send another campaign to the same team or select a different team.`)
      }
      
      setTimeout(() => {
        setSendStatus("idle")
        setSendMessage("")
      }, 5000)

    } catch (error) {
      console.error("Error sending SMS:", error)
      setSendStatus("error")
      setSendMessage(error instanceof Error ? error.message : "Unknown error sending SMS")
    } finally {
      setIsSending(false)
    }
  }

  const handleSendEmail = async () => {
    if (!selectedTeamId || selectedParents.length === 0) {
      setSendStatus("error")
      setSendMessage("You must select a team and at least one parent")
      return
    }

    // Validación diferente según el modo
    if (isHtmlMode) {
      if (!customSubject.trim() || !htmlContent.trim()) {
        setSendStatus("error")
        setSendMessage("You must provide a subject and HTML content for the email")
        return
      }
    } else {
      if (!customSubject.trim() || !customContent.trim()) {
        setSendStatus("error")
        setSendMessage("You must provide a subject and content for the email")
        return
      }
    }

    try {
      setIsSending(true)
      setSendStatus("idle")
      
      const requestPayload = {
        teamId: selectedTeamId,
        parentIds: selectedParents,
        subject: customSubject,
        content: isHtmlMode ? htmlContent : customContent,
        templateId: selectedTemplate,
        isHtml: isHtmlMode
      }
      
      console.log('[CLIENT] Sending email request:', {
        teamId: requestPayload.teamId,
        parentCount: requestPayload.parentIds?.length,
        hasSubject: !!requestPayload.subject,
        hasContent: !!requestPayload.content,
        contentLength: requestPayload.content?.length,
        isHtml: requestPayload.isHtml
      })
      
      const response = await fetch("/api/marketing/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestPayload)
      })

      if (!response.ok) {
        // Intentar obtener más detalles del error
        let errorMessage = `Server returned ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
          console.error('[CLIENT] Server error details:', errorData)
        } catch (parseError) {
          console.error('[CLIENT] Could not parse error response:', parseError)
        }
        throw new Error(`Failed to send emails: ${errorMessage}`)
      }

      const result = await response.json()
      console.log('[CLIENT] Email send successful:', result)
      
      setSendStatus("success")
      setSendMessage(`Emails sent successfully to ${selectedParents.length} parents! You can send another campaign to the same team or select a different team.`)
      
      // Keep the form state so user can send another campaign or modify settings
      // Only reset the content and status after some time
      setTimeout(() => {
        setSendStatus("idle")
        setSendMessage("")
      }, 5000)

    } catch (error) {
      console.error("Error sending emails:", error)
      setSendStatus("error")
      setSendMessage(error instanceof Error ? error.message : "Unknown error sending emails")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Campaign Type Selection */}
      {!campaignType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Choose Campaign Type
            </CardTitle>
            <CardDescription>
              Select whether you want to send an Email campaign or SMS campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setCampaignType('email')}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300"
              >
                <AtSign className="h-8 w-8 text-blue-600" />
                <div className="text-center">
                  <div className="font-semibold">Email Campaign</div>
                  <div className="text-xs text-muted-foreground">Send HTML emails with templates</div>
                </div>
              </Button>

              <Button
                onClick={() => setCampaignType('sms')}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300"
              >
                <Smartphone className="h-8 w-8 text-green-600" />
                <div className="text-center">
                  <div className="font-semibold">SMS Campaign</div>
                  <div className="text-xs text-muted-foreground">Send text messages to mobile phones</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign Type Selected - Show Steps */}
      {campaignType && (
        <div className="space-y-6">
          {/* Campaign Type Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {campaignType === 'email' ? (
                    <>
                      <AtSign className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">Email Campaign</h3>
                        <p className="text-sm text-muted-foreground">Send personalized emails to parents</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="font-semibold">SMS Campaign</h3>
                        <p className="text-sm text-muted-foreground">Send text messages to mobile phones</p>
                      </div>
                    </>
                  )}
                </div>
                <Button 
                  onClick={() => {
                    setCampaignType(null)
                    setSelectedTeamId(null)
                    setSelectedParents([])
                    setSelectedTemplate(null)
                    setCustomSubject("")
                    setCustomContent("")
                    setSmsMessage("")
                    setIsCustomTemplate(false)
                    setUploadedPdf(null)
                    setUploadedPngTemplate(null)
                    setHtmlContent("")
                    setIsHtmlMode(false)
                    setSendStatus("idle")
                    setSendMessage("")
                  }}
                  variant="outline"
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Change Type
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            className="hidden"
          />
          <input
            ref={pngInputRef}
            type="file"
            accept="image/*"
            onChange={handlePngUpload}
            className="hidden"
          />

          {/* Step 1: Team Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Step 1: Select Team
              </CardTitle>
              <CardDescription>
                Choose the team whose parents will receive the {campaignType}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamSelector 
                selectedTeamId={selectedTeamId}
                onTeamSelect={setSelectedTeamId}
              />
            </CardContent>
          </Card>

          {/* Step 2: Parent Selection */}
          {selectedTeamId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Step 2: Select Parents
                </CardTitle>
                <CardDescription>
                  Choose which parents will receive the {campaignType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ParentSelector 
                  teamId={selectedTeamId}
                  selectedParents={selectedParents}
                  onParentsChange={setSelectedParents}
                />
              </CardContent>
            </Card>
          )}

          {/* Email Template Selection */}
          {campaignType === 'email' && selectedParents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Step 3: Choose Email Template
                </CardTitle>
                <CardDescription>
                  Select an email template or create a custom one
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-select">Email Template</Label>
                  <Select 
                    value={
                      uploadedPdf ? "pdf" :
                      uploadedPngTemplate ? "custom" :
                      isHtmlMode ? "html" :
                      selectedTemplate?.toString() ||
                      (isCustomTemplate ? "custom" : "")
                    }
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger id="template-select">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="html">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          HTML Editor Mode
                        </div>
                      </SelectItem>
                      {!isHtmlMode && (
                        <SelectItem value="custom">
                          <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Upload Custom Template
                          </div>
                        </SelectItem>
                      )}
                      {sampleTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-xs text-muted-foreground">{template.category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* PDF Upload Status */}
                {uploadedPdf && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">PDF Uploaded</p>
                          <p className="text-sm text-blue-700">{uploadedPdf.name}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearPdfUpload}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {isExtractingPdf && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Extracting text from PDF...
                      </div>
                    )}
                  </div>
                )}

                {/* PNG Template Upload Status */}
                {uploadedPngTemplate && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-900">Template Image Uploaded</p>
                          <p className="text-sm text-green-700">{uploadedPngTemplate.name}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearPngUpload}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-3">
                      <img 
                        src={URL.createObjectURL(uploadedPngTemplate)} 
                        alt="Template preview" 
                        className="max-w-full h-auto rounded border max-h-40 object-contain"
                      />
                    </div>
                  </div>
                )}

                {/* HTML Mode Editor */}
                {isHtmlMode && (
                  <div className="space-y-4">
                    <h4 className="font-medium">HTML Email Editor</h4>
                    
                    {/* Available Variables */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-2">Available Database Variables</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_GRADE}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{TEAM_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{COACH_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{SCHOOL_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{SCHOOL_LOCATION}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{TEAM_PRICE}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{TEAM_DESCRIPTION}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_EMAIL}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_PHONE}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{SESSION_DATE}"}</Badge>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Copy and paste these variables into your content. They will be automatically replaced with actual data when sending.
                      </p>
                    </div>
                    
                    {/* Subject field for HTML mode */}
                    <div className="space-y-2">
                      <Label htmlFor="html-email-subject">Email Subject</Label>
                      <Input
                        id="html-email-subject"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Example: Reminder for {STUDENT_NAME} - {TEAM_NAME} Session"
                      />
                    </div>

                    {/* HTML Content Editor */}
                    <div className="space-y-2">
                      <Label htmlFor="html-content">HTML Content</Label>
                      <Textarea
                        id="html-content"
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        placeholder="Example: <h2>Hello {PARENT_NAME},</h2><p>This is a reminder for <strong>{STUDENT_NAME}</strong> training with <strong>{TEAM_NAME}</strong>...</p>"
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </div>

                    {/* HTML Preview */}
                    {htmlContent.trim() && (
                      <div className="space-y-2">
                        <Label>Preview</Label>
                        <div className="border rounded-lg p-4 bg-white" style={{
                          minHeight: '200px',
                          maxHeight: '300px', 
                          maxWidth: '100%',
                          position: 'relative'
                        }}>
                          <div style={{
                            width: '100%',
                            height: '100%',
                            transform: 'scale(0.85)',
                            transformOrigin: 'top left',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: '117.65%', // Compensar el scale de 0.85
                              height: '117.65%',
                              overflow: 'hidden'
                            }}>
                              <div
                                dangerouslySetInnerHTML={{ __html: htmlContent }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom template upload buttons */}
                {isCustomTemplate && !uploadedPdf && !uploadedPngTemplate && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Upload Custom Template</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline" 
                        className="h-32 flex flex-col items-center justify-center space-y-2 border-dashed"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="text-center">
                          <div className="font-medium">Upload PDF</div>
                          <div className="text-xs text-muted-foreground">Extract text content from PDF</div>
                        </div>
                      </Button>
                      
                      <Button 
                        onClick={() => pngInputRef.current?.click()}
                        variant="outline" 
                        className="h-32 flex flex-col items-center justify-center space-y-2 border-dashed"
                      >
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="text-center">
                          <div className="font-medium">Upload Image Template</div>
                          <div className="text-xs text-muted-foreground">PNG, JPG or other image formats</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Template Preview */}
          {selectedTemplateData && !uploadedPdf && !isHtmlMode && (
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>
                  Preview of {selectedTemplateData.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 rounded-lg border space-y-2">
                  <div className="font-medium">Subject: {selectedTemplateData.subject}</div>
                  <Separator />
                  <div 
                    className="prose prose-sm max-w-none"
                    style={{ 
                      maxHeight: '70%', 
                      overflow: 'hidden',
                      fontSize: 'clamp(10px, 2vw, 14px)' 
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedTemplateData.content }} 
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Content Customization */}
          {(selectedTemplate || isCustomTemplate || uploadedPdf || isHtmlMode) && !isHtmlMode && (
            <Card>
              <CardHeader>
                <CardTitle>Customize Email Content</CardTitle>
                <CardDescription>
                  Modify the subject and content of your email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available Variables */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-900 mb-2">Available Database Variables</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_GRADE}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{TEAM_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{COACH_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{SCHOOL_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{SCHOOL_LOCATION}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{TEAM_PRICE}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{TEAM_DESCRIPTION}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_EMAIL}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_PHONE}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{SESSION_DATE}"}</Badge>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Copy and paste these variables into your content. They will be automatically replaced with actual data when sending.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-subject">Email Subject</Label>
                  <Input
                    id="email-subject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Example: Reminder for {STUDENT_NAME} - {TEAM_NAME} Session"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-content">Email Content</Label>
                  <Textarea
                    id="email-content"
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder="Example: Hello {PARENT_NAME}, this is a reminder for {STUDENT_NAME}'s training with {TEAM_NAME} at {SCHOOL_LOCATION}..."
                    className="min-h-[200px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* SMS Message Input */}
          {campaignType === 'sms' && selectedParents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Step 3: Compose SMS Message
                </CardTitle>
                <CardDescription>
                  Write your text message (SMS messages are limited to 160 characters per segment)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available Variables for SMS */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="font-medium text-green-900 mb-2">Available Database Variables</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{PARENT_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{STUDENT_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{STUDENT_GRADE}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{TEAM_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{COACH_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{SCHOOL_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{SCHOOL_LOCATION}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{TEAM_PRICE}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{TEAM_DESCRIPTION}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{PARENT_EMAIL}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{PARENT_PHONE}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{SESSION_DATE}"}</Badge>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Copy and paste these variables into your SMS message. They will be automatically replaced with actual data when sending.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sms-message">SMS Message</Label>
                  <Textarea
                    id="sms-message"
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Example: Hi {PARENT_NAME}! Reminder: {STUDENT_NAME} has training with {TEAM_NAME} today at {SCHOOL_LOCATION}. Coach: {COACH_NAME}"
                    className="min-h-[100px]"
                  />
                  <div className="text-sm text-muted-foreground">
                    Characters: {smsMessage.length} / 160 (approx. {Math.ceil(smsMessage.length / 160)} SMS segments)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Send Campaign */}
          {((selectedTemplate || isCustomTemplate || uploadedPdf || isHtmlMode) && 
            campaignType === 'email' && 
            (isHtmlMode ? htmlContent : customContent) ? "1" : "0") === "1" || 
           (campaignType === 'sms' && smsMessage.trim()) ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Campaign
                </CardTitle>
                <CardDescription>
                  Review and send your {campaignType} campaign to {selectedParents.length} parent{selectedParents.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Send Status */}
                {sendStatus !== "idle" && (
                  <Alert className={sendStatus === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    {sendStatus === "success" ? 
                      <CheckCircle className="h-4 w-4 text-green-600" /> : 
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    }
                    <AlertDescription className={sendStatus === "success" ? "text-green-800" : "text-red-800"}>
                      {sendMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Send Button */}
                <div className="flex justify-between items-center">
                  <Button
                    onClick={campaignType === 'email' ? handleSendEmail : handleSendSMS}
                    disabled={
                      isSending || 
                      (campaignType === 'email' && 
                       ((isHtmlMode ? !htmlContent.trim() : !customContent.trim()) ||
                        !customSubject.trim())) ||
                      (campaignType === 'sms' && !smsMessage.trim()) ||
                      selectedParents.length === 0
                    }
                    className="w-full"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending {campaignType}...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send {campaignType.toUpperCase()} to {selectedParents.length} parent{selectedParents.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                  
                  {/* Test Configuration Button */}
                  {campaignType === 'email' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/marketing/test-email-config')
                          const result = await response.json()
                          console.log('[CLIENT] Email config test:', result)
                          setSendStatus("success")
                          setSendMessage("Email configuration test completed. Check console for details.")
                        } catch (error) {
                          console.error('[CLIENT] Config test failed:', error)
                          setSendStatus("error")
                          setSendMessage("Email configuration test failed. Check console for details.")
                        }
                      }}
                      className="ml-2 whitespace-nowrap"
                    >
                      Test Config
                    </Button>
                  )}
                  
                  {/* Test SMS Configuration Button */}
                  {campaignType === 'sms' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/marketing/test-sms-config')
                          const result = await response.json()
                          console.log('[CLIENT] SMS config test:', result)
                          if (result.success) {
                            setSendStatus("success")
                            setSendMessage(`SMS configuration verified! Twilio phone: ${result.envCheck?.twilioPhone || 'configured'}`)
                          } else {
                            setSendStatus("error")
                            setSendMessage(`SMS configuration failed: ${result.error || 'Unknown error'}`)
                          }
                        } catch (error) {
                          console.error('[CLIENT] SMS config test failed:', error)
                          setSendStatus("error")
                          setSendMessage("SMS configuration test failed. Check console for details.")
                        }
                      }}
                      className="ml-2 whitespace-nowrap"
                    >
                      Test SMS Config
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  )
}
