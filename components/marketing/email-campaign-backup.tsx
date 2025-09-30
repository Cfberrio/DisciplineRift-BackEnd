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
      <p>We hope <strong>{STUDENT_NAME}</strong> (Grade: {STUDENT_GRADE}) is enjoying their participation in <strong>{TEAM_NAME}</strong>.</p>
      <p>We want to keep you informed about some important aspects of the team:</p>
      <p><strong>Team Information:</strong></p>
      <ul>
        <li>Team Name: {TEAM_NAME}</li>
        <li>Description: {TEAM_DESCRIPTION}</li>
        <li>School: {SCHOOL_NAME}</li>
        <li>Location: {SCHOOL_LOCATION}</li>
        <li>Coach: {COACH_NAME}</li>
        <li>Team Fee: {TEAM_PRICE}</li>
      </ul>
      <p><strong>Contact Information on File:</strong></p>
      <ul>
        <li><strong>Parent Email:</strong> {PARENT_EMAIL}</li>
        <li><strong>Parent Phone:</strong> {PARENT_PHONE}</li>
        <li><strong>Emergency Contact:</strong> {EMERGENCY_CONTACT_NAME}</li>
        <li><strong>Emergency Phone:</strong> {EMERGENCY_CONTACT_PHONE}</li>
        <li><strong>Relationship:</strong> {EMERGENCY_CONTACT_RELATIONSHIP}</li>
      </ul>
      <p>If any of this information needs to be updated, please let us know.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Sincerely,<br>The {SCHOOL_NAME} Administrative Team</p>
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
  const [showPreview, setShowPreview] = useState(false)
  
  // Estados para SMS
  const [smsMessage, setSmsMessage] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pngInputRef = useRef<HTMLInputElement>(null)

  const selectedTemplateData = selectedTemplate 
    ? sampleTemplates.find(t => t.id === selectedTemplate)
    : null

  const handleTemplateChange = (templateId: string) => {
    // Reset all states
    setIsCustomTemplate(false)
    setIsHtmlMode(false)
    setSelectedTemplate(null)
    setUploadedPdf(null)
    setUploadedPngTemplate(null)
    setCustomSubject("")
    setCustomContent("")
    setHtmlContent("")
    setShowPreview(false)

    if (templateId === "html") {
      setIsHtmlMode(true)
      setCustomSubject("")
      setHtmlContent("")
    } else if (templateId === "custom") {
      setIsCustomTemplate(true)
      if (pngInputRef.current) {
        pngInputRef.current.click()
      }
    } else {
      const id = parseInt(templateId)
      setSelectedTemplate(id)
      const template = sampleTemplates.find(t => t.id === id)
      if (template) {
        setCustomSubject(template.subject)
        setCustomContent(template.content)
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

      const data = await response.json()
      setPdfContent(data.text)
      setCustomContent(data.text)
      setCustomSubject(`Email content from ${file.name}`)
      setIsCustomTemplate(true)
      setSelectedTemplate(null)
      
      setSendStatus("success")
      setSendMessage("PDF content extracted successfully")
    } catch (error) {
      console.error('Error extracting PDF:', error)
      setSendStatus("error")
      setSendMessage("Failed to extract text from PDF")
      setUploadedPdf(null)
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

  const removePdf = () => {
    setUploadedPdf(null)
    setPdfContent("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removePngTemplate = () => {
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
        hasMessage: !!requestPayload.message,
        messageLength: requestPayload.message?.length
      })
      
      const response = await fetch("/api/marketing/send-sms", {
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
        throw new Error(`Failed to send SMS: ${errorMessage}`)
      }

      const result = await response.json()
      console.log('[CLIENT] SMS send successful:', result)
      
      setSendStatus("success")
      setSendMessage(`SMS sent successfully to ${selectedParents.length} parents! You can send another campaign to the same team or select a different team.`)
      
      // Keep the form state so user can send another campaign or modify settings
      // Only reset the content and status after some time
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
                    // Reset all form data
                    setSelectedTeamId(null)
                    setSelectedParents([])
                    setSelectedTemplate(null)
                    setCustomSubject("")
                    setCustomContent("")
                    setSmsMessage("")
                    setIsCustomTemplate(false)
                    setIsHtmlMode(false)
                    setHtmlContent("")
                    setSendStatus("idle")
                    setSendMessage("")
                  }}
                  variant="outline"
                  size="sm"
                >
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

      {/* Team Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Step 1: Select Team
          </CardTitle>
          <CardDescription>
            Choose the team whose parents will receive the email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeamSelector 
            onTeamSelect={setSelectedTeamId}
            selectedTeamId={selectedTeamId}
          />
        </CardContent>
      </Card>

      {/* Parent Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Step 2: Select Recipients
          </CardTitle>
          <CardDescription>
            Choose the parents who will receive the email
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

      {/* Template Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Step 3: Choose Template
          </CardTitle>
          <CardDescription>
            Select a predefined template, create an HTML email, or create a custom message with image template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template-select">Email Template</Label>
            <Select 
              value={
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
                    HTML Email
                  </div>
                </SelectItem>
                {!isHtmlMode && (
                  <>
                    <SelectItem value="custom">
                      <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Custom Message with Image Template
                      </div>
                    </SelectItem>
                    <Separator />
                    {sampleTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{template.name}</span>
                          <span className="text-xs text-muted-foreground">{template.category}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
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
                  onClick={removePdf}
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
                  onClick={removePngTemplate}
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

          {/* HTML Editor */}
          {isHtmlMode && (
            <div className="space-y-4">
              <h4 className="font-medium">HTML Email Editor</h4>

              {/* Email Subject Field */}
              <div className="space-y-2">
                <Label htmlFor="html-email-subject">Email Subject</Label>
                <Input
                  id="html-email-subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Email subject..."
                />
              </div>
              
              {/* HTML Content Editor */}
              <div className="space-y-2">
                <Label htmlFor="html-content">HTML Content</Label>
                <Textarea
                  id="html-content"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Enter your HTML and CSS here..."
                  className="min-h-[300px] font-mono text-sm resize-none w-full"
                />
              </div>

              {/* HTML Preview */}
              <div className="space-y-2">
                <Label>Live Preview</Label>
                <div className="border-2 rounded-lg bg-gray-50 p-1 w-full overflow-hidden">
                  <div 
                    className="bg-white rounded border shadow-sm w-full overflow-hidden"
                    style={{ 
                      height: '300px', 
                      maxWidth: '100%',
                      position: 'relative'
                    }}
                  >
                    {htmlContent.trim() ? (
                      <div 
                        className="email-preview-container"
                        style={{ 
                          width: '100%',
                          height: '100%',
                          transform: 'scale(0.85)',
                          transformOrigin: 'top left',
                          overflow: 'hidden'
                        }}
                      >
                        <div 
                          style={{ 
                            width: '117.65%', // Compensar el scale de 0.85
                            height: '117.65%',
                            overflow: 'hidden'
                          }}
                          dangerouslySetInnerHTML={{ __html: htmlContent }} 
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>HTML preview will appear here...</p>
                          <p className="text-xs mt-1">Start typing HTML to see the result</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  ✨ Updates in real-time as you type
                </p>
              </div>

              <div className="text-xs text-muted-foreground">
                <strong>Available variables from database:</strong>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <span>{"{PARENT_NAME}"}</span>
                  <span>{"{STUDENT_NAME}"}</span>
                  <span>{"{TEAM_NAME}"}</span>
                  <span>{"{SCHOOL_NAME}"}</span>
                  <span>{"{SCHOOL_LOCATION}"}</span>
                  <span>{"{COACH_NAME}"}</span>
                  <span>{"{PARENT_EMAIL}"}</span>
                  <span>{"{PARENT_PHONE}"}</span>
                  <span>{"{STUDENT_GRADE}"}</span>
                  <span>{"{TEAM_PRICE}"}</span>
                  <span>{"{TEAM_DESCRIPTION}"}</span>
                  <span>{"{EMERGENCY_CONTACT_NAME}"}</span>
                  <span>{"{EMERGENCY_CONTACT_PHONE}"}</span>
                  <span>{"{EMERGENCY_CONTACT_RELATIONSHIP}"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Template Preview */}
          {selectedTemplateData && !uploadedPdf && !isHtmlMode && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Template Preview:</h4>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Subject:</strong> {selectedTemplateData.subject}
              </p>
              <div className="text-sm bg-background p-3 rounded border max-h-32 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: selectedTemplateData.content }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Editor */}
      {(selectedTemplate || isCustomTemplate || uploadedPdf || isHtmlMode) && !isHtmlMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Step 4: Customize Message
            </CardTitle>
            <CardDescription>
              Edit the subject and content of the email. Use variables from the database to personalize each email automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Email Subject</Label>
              <Input
                id="email-subject"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-content">Email Content</Label>
              <Textarea
                id="email-content"
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}
                placeholder="Email content..."
                className="min-h-[200px]"
              />
            </div>

            {/* PNG Template Preview with Text Overlay */}
            {uploadedPngTemplate && (
              <div className="space-y-2">
                <Label>Template Preview with Your Text</Label>
                <div className="relative border rounded-lg overflow-hidden bg-white max-w-md mx-auto">
                  <img 
                    src={URL.createObjectURL(uploadedPngTemplate)} 
                    alt="Template background" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-8">
                    <div 
                      className="text-center bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-lg max-w-xs"
                      style={{ 
                        maxHeight: '70%', 
                        overflow: 'hidden',
                        fontSize: 'clamp(10px, 2vw, 14px)' 
                      }}
                    >
                      <h3 className="font-bold mb-2 text-gray-800">
                        {customSubject || "Email Subject"}
                      </h3>
                      <div className="text-gray-700 text-sm leading-tight">
                        {customContent || "Your email content will appear here..."}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Preview of how your text will appear over the template image
                </p>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              <strong>Available variables from database:</strong>
              <div className="mt-1 grid grid-cols-2 gap-1">
                <span>{"{PARENT_NAME}"}</span>
                <span>{"{STUDENT_NAME}"}</span>
                <span>{"{TEAM_NAME}"}</span>
                <span>{"{SCHOOL_NAME}"}</span>
                <span>{"{SCHOOL_LOCATION}"}</span>
                <span>{"{COACH_NAME}"}</span>
                <span>{"{PARENT_EMAIL}"}</span>
                <span>{"{PARENT_PHONE}"}</span>
                <span>{"{STUDENT_GRADE}"}</span>
                <span>{"{TEAM_PRICE}"}</span>
                <span>{"{TEAM_DESCRIPTION}"}</span>
                <span>{"{EMERGENCY_CONTACT_NAME}"}</span>
                <span>{"{EMERGENCY_CONTACT_PHONE}"}</span>
                <span>{"{EMERGENCY_CONTACT_RELATIONSHIP}"}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Review and Send */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Step 5: Review and Send
          </CardTitle>
          <CardDescription>
            Review the details before sending the campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {selectedTeamId ? "1" : "0"}
              </div>
              <div className="text-sm text-muted-foreground">Team selected</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {selectedParents.length}
              </div>
              <div className="text-sm text-muted-foreground">Recipients</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {(selectedTemplate || isCustomTemplate || uploadedPdf || isHtmlMode) && 
                 customSubject && 
                 (isHtmlMode ? htmlContent : customContent) ? "1" : "0"}
              </div>
              <div className="text-sm text-muted-foreground">Template ready</div>
            </div>
          </div>

          {/* Status Messages */}
          {sendStatus === "success" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-600">
                {sendMessage}
              </AlertDescription>
            </Alert>
          )}

          {sendStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {sendMessage}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button 
              onClick={handleSendEmail}
              disabled={
                !selectedTeamId || 
                selectedParents.length === 0 || 
                !customSubject.trim() || 
                (isHtmlMode ? !htmlContent.trim() : !customContent.trim()) ||
                isSending
              }
              className="w-full"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Campaign ({selectedParents.length} recipients)
                </>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={async () => {
                  try {
                    setSendStatus("idle")
                    const response = await fetch('/api/marketing/test-email-config')
                    const result = await response.json()
                    console.log('[CLIENT] Email config test:', result)
                    if (result.success) {
                      setSendStatus("success")
                      setSendMessage("✅ Email configuration is working correctly!")
                    } else {
                      setSendStatus("error")
                      setSendMessage(`❌ Email config error: ${result.error}`)
                    }
                  } catch (error) {
                    console.error('[CLIENT] Config test failed:', error)
                    setSendStatus("error")
                    setSendMessage("❌ Failed to test email configuration")
                  }
                }}
                variant="outline"
                className="w-full"
                size="sm"
              >
                🔧 Test Config
              </Button>
              
              <Button 
                onClick={() => {
                  // Reset the entire form for a new campaign
                  setSelectedTeamId(null)
                  setSelectedParents([])
                  setSelectedTemplate(null)
                  setCustomSubject("")
                  setCustomContent("")
                  setIsCustomTemplate(false)
                  setIsHtmlMode(false)
                  setHtmlContent("")
                  setUploadedPdf(null)
                  setUploadedPngTemplate(null)
                  setPdfContent("")
                  setShowPreview(false)
                  setSendStatus("idle")
                  setSendMessage("")
                }}
                variant="outline"
                className="w-full"
                size="sm"
              >
                🔄 New Campaign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
