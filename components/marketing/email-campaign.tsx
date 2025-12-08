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
import { WeekdayTeamSelector } from "./weekday-team-selector"
import { ParentSelector } from "./parent-selector"
import { Mail, Send, Users, FileText, AlertCircle, CheckCircle, Loader2, Upload, File, X, MessageSquare, Smartphone, AtSign, Calendar } from "lucide-react"

interface EmailTemplate {
  id: number
  name: string
  subject: string
  content: string
  category: string
}

// Sample templates in English with database variables
const sampleTemplates: EmailTemplate[] = [
  
]

interface EmailCampaignProps {
  onClose?: () => void
}

export function EmailCampaign({ onClose }: EmailCampaignProps) {
  // State to select campaign type
  const [campaignType, setCampaignType] = useState<'email' | 'sms' | null>(null)
  const [seasonType, setSeasonType] = useState<'current' | 'upcoming' | 'closed' | null>(null)
  
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
  const [isHtmlMode, setIsHtmlMode] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")
  
  // SMS states
  const [smsMessage, setSmsMessage] = useState("")

  const selectedTemplateData = selectedTemplate 
    ? sampleTemplates.find(t => t.id === selectedTemplate)
    : null

  // Function to convert line breaks to HTML
  const formatTextToHtml = (text: string): string => {
    if (!text) return ''
    
    // Split by double line breaks to create paragraphs
    const paragraphs = text.split(/\n\n+/)
    
    return paragraphs
      .map(paragraph => {
        // Replace single line breaks with <br> within paragraphs
        const formattedParagraph = paragraph.trim().replace(/\n/g, '<br>')
        return formattedParagraph ? `<p style="margin: 0 0 12px 0;">${formattedParagraph}</p>` : ''
      })
      .filter(p => p)
      .join('')
  }

  const handleTemplateChange = (value: string) => {
    if (value === "html") {
      setIsHtmlMode(true)
      setIsCustomTemplate(false)
      setSelectedTemplate(null)
      setCustomSubject("")
      setHtmlContent("")
      setAdditionalInfo("")
    } else if (value === "custom") {
      setIsCustomTemplate(true)
      setIsHtmlMode(false)
      setSelectedTemplate(null)
      setCustomSubject("Important Information - {TEAM_NAME}")
      setAdditionalInfo("")
    } else {
      const templateId = parseInt(value)
      if (!isNaN(templateId)) {
        setSelectedTemplate(templateId)
        setIsCustomTemplate(false)
        setIsHtmlMode(false)
        setAdditionalInfo("")
        
        const template = sampleTemplates.find(t => t.id === templateId)
        if (template) {
          setCustomSubject(template.subject)
          setCustomContent(template.content)
        }
      }
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
          console.error('[CLIENT] Server error details:', errorData)
          if (errorData.details) {
            errorMessage = `${errorData.error}: ${errorData.details}`
          } else if (errorData.error) {
            errorMessage = errorData.error
          }
          if (errorData.hint) {
            console.error('[CLIENT] Server hint:', errorData.hint)
          }
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
    } else if (isCustomTemplate) {
      // Para DR Team Details solo requiere subject, additionalInfo es opcional
      if (!customSubject.trim()) {
        setSendStatus("error")
        setSendMessage("You must provide a subject for the email")
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
      
      // Plantilla HTML personalizada
      let finalContent = isHtmlMode ? htmlContent : customContent
      let useHtmlMode = isHtmlMode
      
      if (isCustomTemplate) {
        useHtmlMode = true
        
        // Cargar imágenes y convertirlas a base64
        const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
          try {
            const response = await fetch(imagePath)
            const blob = await response.blob()
            return new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(blob)
            })
          } catch (error) {
            console.error(`Error loading image ${imagePath}:`, error)
            return ''
          }
        }

        const headerImageBase64 = await loadImageAsBase64('/Header.png')
        const footerImageBase64 = await loadImageAsBase64('/Footer.png')
        const groupImageBase64 = await loadImageAsBase64('/Group 3.png')
        
        console.log('[CLIENT] Images loaded:', {
          headerLoaded: !!headerImageBase64,
          footerLoaded: !!footerImageBase64,
          groupLoaded: !!groupImageBase64
        })
        
        finalContent = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${customSubject}</title>
    <style>
      body { margin:0; padding:0; background:#f5f5f5; }
      table { border-collapse:collapse; }
      img { display:block; line-height:0; font-size:0; border:0; }
      .wrapper { width:100%; background:#f5f5f5; }
      .container { width:600px; max-width:600px; margin:0 auto; }
      .px { padding-left:24px; padding-right:24px; }
      .content { font-family: Arial, Helvetica, sans-serif; color:#0b0b0b; font-size:16px; line-height:1.5; }
      .brand-blue { color:#0B86C6; }
      .title {
        font-weight:800;
        font-size:28px;
        letter-spacing:0.5px;
        text-transform:uppercase;
        margin: 18px 0 6px 0;
      }
      .underline {
        height:6px; width:120px; background:#0B86C6; border-radius:3px; margin:0 0 18px 0;
      }
      .lead { font-size:15px; color:#222; margin:0 0 22px 0; }
      .label { font-weight:800; color:#0B86C6; font-size:22px; }
      .value { font-size:18px; color:#111; }
      .spacer-8 { height:8px; line-height:8px; font-size:8px; }
      .spacer-12 { height:12px; line-height:12px; font-size:12px; }
      .spacer-16 { height:16px; line-height:16px; font-size:16px; }
      .box-note {
        border-radius:12px; border:1px solid #e6eef5; background:#f8fcff; padding:16px; font-size:14px; color:#333;
      }
      .footer-space { height:24px; line-height:24px; font-size:24px; }
      @media (max-width:620px) {
        .container { width:100% !important; }
        .title { font-size:24px !important; }
        .label { font-size:18px !important; }
        .value { font-size:14px !important; }
      }
    </style>
  </head>
  <body>
    <center class="wrapper">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <img src="${headerImageBase64}" width="600" alt="Header" />
                </td>
              </tr>
            </table>

            <table role="presentation" class="container content" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
              <tr>
                <td class="px" style="background-color: #ffffff;">
                  <div class="title brand-blue">Hello, {PARENT_FIRSTNAME}</div>
                  <div class="underline" aria-hidden="true"></div>

                  <p class="lead">
                    Here's some information about <strong>{STUDENT_FIRSTNAME}</strong>'s participation in <strong>{TEAM_NAME}</strong>.
                  </p>

                  <div class="spacer-16">&nbsp;</div>

                  <div class="box-note">
                    ${formatTextToHtml(additionalInfo) || '<p style="margin: 0;">If you have any questions, please do not hesitate to contact us.</p>'}
                  </div>

                  <div class="spacer-16">&nbsp;</div>

                  <div style="text-align: center; margin: 8px 0 18px 0;">
                    <img src="${groupImageBase64}" alt="Team Details" style="max-width: 100%; height: auto; display: inline-block;" />
                  </div>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="40%" valign="middle" class="label" style="text-align: left;">Coach</td>
                      <td width="60%" valign="middle" class="value" style="text-align: right;">{COACH_NAME}</td>
                    </tr>
                    <tr><td class="spacer-12" colspan="2">&nbsp;</td></tr>
                    <tr>
                      <td valign="middle" class="label" style="text-align: left;">Location</td>
                      <td valign="middle" class="value" style="text-align: right;">{SCHOOL_LOCATION}</td>
                    </tr>
                    <tr><td class="spacer-12" colspan="2">&nbsp;</td></tr>
                    <tr>
                      <td valign="middle" class="label" style="text-align: left;">School</td>
                      <td valign="middle" class="value" style="text-align: right;">{SCHOOL_NAME}</td>
                    </tr>
                  </table>

                  <div class="spacer-16">&nbsp;</div>
                </td>
              </tr>
            </table>

            <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0">
              <tr><td class="footer-space">&nbsp;</td></tr>
              <tr>
                <td>
                  <img src="${footerImageBase64}" width="600" alt="Footer" />
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </center>
  </body>
</html>
        `
      }
      
      const requestPayload = {
        teamId: selectedTeamId,
        parentIds: selectedParents,
        subject: customSubject,
        content: finalContent,
        templateId: selectedTemplate,
        isHtml: useHtmlMode
      }
      
      console.log('[CLIENT] Sending email request:', {
        teamId: requestPayload.teamId,
        parentCount: requestPayload.parentIds?.length,
        hasSubject: !!requestPayload.subject,
        hasContent: !!requestPayload.content,
        contentLength: requestPayload.content?.length,
        isHtml: requestPayload.isHtml,
        hasCustomTemplate: isCustomTemplate
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
          console.error('[CLIENT] Server error details:', errorData)
          if (errorData.details) {
            errorMessage = `${errorData.error}: ${errorData.details}`
          } else if (errorData.error) {
            errorMessage = errorData.error
          }
          if (errorData.hint) {
            console.error('[CLIENT] Server hint:', errorData.hint)
          }
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
                    setSeasonType(null)
                    setSelectedTeamId(null)
                    setSelectedParents([])
                    setSelectedTemplate(null)
                    setCustomSubject("")
                    setCustomContent("")
                    setSmsMessage("")
                    setIsCustomTemplate(false)
                    setHtmlContent("")
                    setIsHtmlMode(false)
                    setAdditionalInfo("")
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


          {/* Step 1: Season Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Step 1: Select Season
              </CardTitle>
              <CardDescription>
                Choose between Ongoing (teams currently running), Open (teams open for registration), or Closed (teams that have finished)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => {
                    setSeasonType('current')
                    setSelectedTeamId(null)
                    setSelectedParents([])
                  }}
                  variant={seasonType === 'current' ? 'default' : 'outline'}
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                >
                  <Calendar className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Ongoing</div>
                    <div className="text-xs opacity-80">Teams currently running</div>
                  </div>
                </Button>

                <Button
                  onClick={() => {
                    setSeasonType('upcoming')
                    setSelectedTeamId(null)
                    setSelectedParents([])
                  }}
                  variant={seasonType === 'upcoming' ? 'default' : 'outline'}
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                >
                  <Calendar className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Open</div>
                    <div className="text-xs opacity-80">Teams open for registration</div>
                  </div>
                </Button>

                <Button
                  onClick={() => {
                    setSeasonType('closed')
                    setSelectedTeamId(null)
                    setSelectedParents([])
                  }}
                  variant={seasonType === 'closed' ? 'default' : 'outline'}
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                >
                  <Calendar className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Closed</div>
                    <div className="text-xs opacity-80">Teams that have finished</div>
                  </div>
                </Button>
              </div>

              {seasonType && (
                <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-700 font-medium">
                    {seasonType === 'current' ? 'Ongoing' : seasonType === 'upcoming' ? 'Open' : 'Closed'} selected
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Team Selection */}
          {seasonType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Step 2: Select Team by Day of Week
                </CardTitle>
                <CardDescription>
                  Teams are grouped by the days they have sessions. Choose the team whose parents will receive the {campaignType}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeekdayTeamSelector 
                  selectedTeamId={selectedTeamId}
                  onTeamSelect={setSelectedTeamId}
                  seasonType={seasonType}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Parent Selection */}
          {selectedTeamId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Step 3: Select Parents
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
                  Step 4: Choose Email Template
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
                            <FileText className="h-4 w-4" />
                            DR Team Details Template
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

                {/* HTML Mode Editor */}
                {isHtmlMode && (
                  <div className="space-y-4">
                    <h4 className="font-medium">HTML Email Editor</h4>
                    
                    {/* Available Variables */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-2">Available Database Variables</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_FIRSTNAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_FIRSTNAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_GRADE}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{TEAM_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{SPORT}"}</Badge>
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

                {/* DR Team Details Template - Additional Information */}
                {isCustomTemplate && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h5 className="font-medium text-blue-900 mb-2">Available Dynamic Variables</h5>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_FIRSTNAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_FIRSTNAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_GRADE}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{TEAM_NAME}"}</Badge>
                        <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{SPORT}"}</Badge>
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
                        Copy and paste these variables into your subject or message content. They will be automatically replaced with actual data when sending.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="custom-subject">Email Subject</Label>
                      <Input
                        id="custom-subject"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Example: Important Information - {TEAM_NAME}"
                      />
                      <p className="text-xs text-muted-foreground">
                        You can use variables like {"{TEAM_NAME}"}, {"{PARENT_NAME}"}, etc.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="additional-info">Custom Message Content</Label>
                      <Textarea
                        id="additional-info"
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        placeholder="Example: Please remember to bring your equipment. Training starts at 5:00 PM sharp. You can use variables like {PARENT_NAME}, {STUDENT_NAME}, {TEAM_NAME}, etc."
                        className="min-h-[150px]"
                      />
                      <p className="text-xs text-muted-foreground">
                        This text will appear in the blue box section of the email (without a title). If left empty, 
                        a default message will be displayed. You can use dynamic variables.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* DR Team Details Template Preview */}
          {isCustomTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
                <CardDescription>
                  Preview of DR Team Details Email Template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg overflow-hidden"
                  style={{
                    width: '100%',
                    maxWidth: '900px',
                    margin: '0 auto',
                    backgroundColor: '#f5f5f5',
                    transform: 'scale(1)',
                    transformOrigin: 'top center'
                  }}
                >
                  <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
                    {/* Header Image */}
                    <img 
                      src="/Header.png" 
                      alt="Header" 
                      style={{ width: '100%', display: 'block' }}
                    />
                    
                    {/* Content */}
                    <div style={{ padding: '32px', fontFamily: 'Arial, Helvetica, sans-serif', backgroundColor: '#ffffff' }}>
                    {/* Title */}
                    <div style={{
                      fontWeight: 800,
                      fontSize: '36px',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: '#0B86C6',
                      margin: '20px 0 8px 0'
                    }}>
                      Hello, {'{PARENT_FIRSTNAME}'}
                    </div>
                    
                    {/* Underline */}
                    <div style={{
                      height: '8px',
                      width: '150px',
                      backgroundColor: '#0B86C6',
                      borderRadius: '4px',
                      margin: '0 0 24px 0'
                    }}></div>
                    
                    {/* Lead text */}
                    <p style={{ fontSize: '18px', color: '#222', margin: '0 0 28px 0', lineHeight: '1.6' }}>
                      Here's some information about <strong>{'{STUDENT_FIRSTNAME}'}</strong>'s participation in <strong>{'{TEAM_NAME}'}</strong>.
                    </p>
                    
                    <div style={{ height: '16px' }}></div>
                    
                    {/* Additional Information Box */}
                    <div 
                      style={{
                        borderRadius: '14px',
                        border: '1px solid #e6eef5',
                        backgroundColor: '#f8fcff',
                        padding: '24px',
                        fontSize: '18px',
                        color: '#333',
                        lineHeight: '1.6'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: formatTextToHtml(additionalInfo) || '<p style="margin: 0;">If you have any questions, please do not hesitate to contact us.</p>'
                      }}
                    />
                    
                    <div style={{ height: '16px' }}></div>
                    
                    {/* Team Details Image */}
                    <div style={{ textAlign: 'center', margin: '12px 0 24px 0' }}>
                      <img 
                        src="/Group 3.png" 
                        alt="Team Details" 
                        style={{ 
                          maxWidth: '100%', 
                          height: 'auto',
                          display: 'inline-block'
                        }}
                      />
                    </div>
                    
                    {/* Team Info - Two Column Layout */}
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#0B86C6', fontSize: '22px' }}>Coach:</span>
                      <span style={{ fontSize: '18px', color: '#111', textAlign: 'right' }}>{'{COACH_NAME}'}</span>
                    </div>
                    
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#0B86C6', fontSize: '22px' }}>Location:</span>
                      <span style={{ fontSize: '18px', color: '#111', textAlign: 'right' }}>{'{SCHOOL_LOCATION}'}</span>
                    </div>
                    
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: '#0B86C6', fontSize: '22px' }}>School:</span>
                      <span style={{ fontSize: '18px', color: '#111', textAlign: 'right' }}>{'{SCHOOL_NAME}'}</span>
                    </div>
                    
                    <div style={{ height: '24px' }}></div>
                  </div>
                  
                    {/* Footer Image */}
                    <img 
                      src="/Footer.png" 
                      alt="Footer" 
                      style={{ width: '100%', display: 'block' }}
                    />
                  </div>
                </div>
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                  All variables will be automatically replaced with actual data when sending the email
                </p>
              </CardContent>
            </Card>
          )}

          {/* Template Preview */}
          {selectedTemplateData && !isHtmlMode && (
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

          {/* Email Content Customization - For other templates */}
          {selectedTemplate && !isHtmlMode && (
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
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{PARENT_FIRSTNAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_FIRSTNAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{STUDENT_GRADE}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{TEAM_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-300">{"{SPORT}"}</Badge>
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
                  Step 4: Write SMS Message
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
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{PARENT_FIRSTNAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{STUDENT_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{STUDENT_FIRSTNAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{STUDENT_GRADE}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{TEAM_NAME}"}</Badge>
                    <Badge variant="outline" className="bg-white text-green-700 border-green-300">{"{SPORT}"}</Badge>
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
          {((selectedTemplate || isCustomTemplate || isHtmlMode) && 
            campaignType === 'email' && 
            ((isHtmlMode && htmlContent) || (isCustomTemplate && customSubject) || (selectedTemplate && customContent)) ? "1" : "0") === "1" || 
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
                       ((isHtmlMode && !htmlContent.trim()) ||
                        (selectedTemplate && !customContent.trim()) ||
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
