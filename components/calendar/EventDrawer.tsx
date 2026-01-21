"use client"

import React, { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  Mail,
  MessageSquare,
  Save,
  Loader2,
  Users,
  AlertCircle,
  Trash2
} from 'lucide-react'

import { 
  getSessionById,
  updateSession,
  getTeamName,
  getCoachInfo,
  getAvailableCoaches,
  getParentsByTeam,
  SessionRow
} from '@/lib/calendar/supabase-client'
import { expandOccurrences, formatDaysOfWeek, validateDaysOfWeek, daysArrayToString, parseDaysOfWeek } from '@/utils/schedule'

interface EventDrawerProps {
  open: boolean
  onClose: () => void
  eventInfo: {
    sessionid: string
    teamid: string
    start: Date
    end: Date
    teamName: string
    occurrence: string
  } | null
  onEventUpdated?: () => void
}

interface EditFormData {
  startdate: string
  enddate: string
  starttime: string
  endtime: string
  daysofweek: string
  coachid: string
  repeat: string
}

interface EmailTemplate {
  subject: string
  html: string
}

export function EventDrawer({ open, onClose, eventInfo, onEventUpdated }: EventDrawerProps) {
  const [session, setSession] = useState<SessionRow | null>(null)
  const [teamName, setTeamName] = useState('')
  const [coachInfo, setCoachInfo] = useState<{ name: string; email?: string } | null>(null)
  const [availableCoaches, setAvailableCoaches] = useState<Array<{ id: string; name: string }>>([])
  const [parents, setParents] = useState<Array<{ parentid: string; email?: string; firstname?: string; lastname?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [showEmailEditor, setShowEmailEditor] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  
  const [editForm, setEditForm] = useState<EditFormData>({
    startdate: '',
    enddate: '',
    starttime: '',
    endtime: '',
    daysofweek: '',
    coachid: '',
    repeat: ''
  })

  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: 'Practice Reminder - {teamName}',
    html: `
<h2>🏐 Practice Reminder</h2>
<p>Hello <strong>{parentName}</strong>,</p>

<p>We remind you that <strong>{studentName}</strong> has a scheduled practice:</p>

<div style="background-color: #f0f8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
  <p><strong>📅 Team:</strong> {teamName}</p>
  <p><strong>📅 Date:</strong> {practiceDate}</p>
  <p><strong>⏰ Time:</strong> {practiceTime}</p>
  <p><strong>👨‍💼 Coach:</strong> {coachName}</p>
</div>

<p>Please make sure to arrive 10 minutes before the start time.</p>

<p>See you at practice!</p>
<p><em>Practice Management System</em></p>
    `.trim()
  })

  const { toast } = useToast()

  // Load data when drawer opens
  useEffect(() => {
    if (open && eventInfo) {
      loadEventData()
    } else if (!open) {
      // Reset state when drawer closes
      setSession(null)
      setTeamName('')
      setCoachInfo(null)
      setEditMode(false)
      setConfirmDelete(false)
      setDeleting(false)
    }
  }, [open, eventInfo?.sessionid, eventInfo?.occurrence])

  const loadEventData = async () => {
    if (!eventInfo) return
    
    try {
      setLoading(true)
      
      // Load all data in parallel for better performance
      const [sessionData, teamNameData, coachesData, parentsData] = await Promise.all([
        getSessionById(eventInfo.sessionid),
        getTeamName(eventInfo.teamid),
        getAvailableCoaches(),
        getParentsByTeam(eventInfo.teamid)
      ])
      
      if (!sessionData) {
        toast({
          title: "Error",
          description: "Could not load session information",
          variant: "destructive"
        })
        return
      }
      
      setSession(sessionData)
      setTeamName(teamNameData)
      setAvailableCoaches(coachesData)
      setParents(parentsData)
      
      // Load coach information if exists
      if (sessionData.coachid) {
        const coachData = await getCoachInfo(sessionData.coachid)
        setCoachInfo(coachData)
      } else {
        setCoachInfo(null)
      }
      
      // Initialize edit form
      setEditForm({
        startdate: sessionData.startdate,
        enddate: sessionData.enddate || sessionData.startdate,
        starttime: sessionData.starttime,
        endtime: sessionData.endtime,
        daysofweek: sessionData.daysofweek || '',
        coachid: sessionData.coachid || 'none',
        repeat: sessionData.repeat || 'weekly'
      })
      
    } catch (error) {
      console.error('Error loading event data:', error)
      toast({
        title: "Error",
        description: "Error loading event data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle saving changes
  const handleSave = async () => {
    if (!session || !eventInfo) return
    
    // Validations
    if (!validateDaysOfWeek(editForm.daysofweek)) {
      toast({
        title: "Validation Error",
        description: "Days of the week are not valid",
        variant: "destructive"
      })
      return
    }
    
    if (editForm.starttime >= editForm.endtime) {
      toast({
        title: "Validation Error", 
        description: "End time must be after start time",
        variant: "destructive"
      })
      return
    }
    
    // Agregar T00:00:00 para forzar interpretación local y evitar desfase de zona horaria
    if (new Date(editForm.startdate + 'T00:00:00') > new Date(editForm.enddate + 'T00:00:00')) {
      toast({
        title: "Validation Error",
        description: "End date must be after start date",
        variant: "destructive"
      })
      return
    }
    
    try {
      setSaving(true)
      
      await updateSession({
        sessionid: session.sessionid,
        startdate: editForm.startdate,
        enddate: editForm.enddate,
        starttime: editForm.starttime,
        endtime: editForm.endtime,
        daysofweek: editForm.daysofweek,
        coachid: editForm.coachid === 'none' ? null : editForm.coachid,
        repeat: editForm.repeat
      })
      
      toast({
        title: "Success",
        description: "Session updated successfully"
      })
      
      setEditMode(false)
      
      // Reload data
      await loadEventData()
      
      // Notify parent to reload calendar
      if (onEventUpdated) {
        onEventUpdated()
      }
      
    } catch (error) {
      console.error('Error saving session:', error)
      toast({
        title: "Error",
        description: "Error saving changes",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle sending custom email
  const handleSendEmail = async () => {
    if (!eventInfo || !session) return
    
    try {
      setSendingEmail(true)
      
      const response = await fetch('/api/calendar/send-custom-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamid: eventInfo.teamid,
          sessionid: eventInfo.sessionid,
          occurrence: eventInfo.occurrence,
          subject: emailTemplate.subject,
          htmlTemplate: emailTemplate.html
        })
      })
      
      if (!response.ok) {
        throw new Error('Error sending emails')
      }
      
      const result = await response.json()
      
      toast({
        title: "Emails sent",
        description: `${result.sent} personalized emails sent to parents`
      })
      
      setShowEmailEditor(false)
      
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "Error",
        description: "Error sending emails",
        variant: "destructive"
      })
    } finally {
      setSendingEmail(false)
    }
  }

  // Handle single occurrence cancellation
  const handleCancelOccurrence = async () => {
    if (!session || !eventInfo) return
    
    try {
      setDeleting(true)
      
      // Convert the occurrence date to YYYY-MM-DD format
      const occurrenceDate = new Date(eventInfo.start)
      const dateString = occurrenceDate.toISOString().split('T')[0]
      
      const response = await fetch(`/api/sessions/${session.sessionid}/cancel-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date_to_cancel: dateString
        })
      })
      
      if (!response.ok) {
        throw new Error('Error canceling date for session')
      }
      
      toast({
        title: "Practice canceled",
        description: `The practice for ${occurrenceDate.toLocaleDateString()} has been canceled`
      })
      
      // Reset states before closing
      setDeleting(false)
      setConfirmDelete(false)
      setEditMode(false)
      
      // Close drawer first
      onClose()
      
      // Then notify parent to reload calendar (after a small delay to ensure drawer is closed)
      setTimeout(() => {
        if (onEventUpdated) {
          onEventUpdated()
        }
      }, 100)
      
    } catch (error) {
      console.error('Error canceling date for session:', error)
      toast({
        title: "Error",
        description: "Error canceling practice",
        variant: "destructive"
      })
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  // Get upcoming occurrences
  const getUpcomingOccurrences = () => {
    if (!session) return []
    
    const occurrences = expandOccurrences(session)
    const now = new Date()
    
    return occurrences
      .filter(occ => occ.start >= now)
      .slice(0, 5)
      .map(occ => DateTime.fromJSDate(occ.start, { zone: 'America/New_York' }))
  }

  const upcomingOccurrences = getUpcomingOccurrences()

  if (!eventInfo) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {teamName}
          </SheetTitle>
          <SheetDescription>
            Manage team practice
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-9 bg-muted rounded animate-pulse" />
              <div className="h-9 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-20 bg-muted rounded animate-pulse" />
              <div className="h-20 bg-muted rounded animate-pulse" />
              <div className="h-20 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-center py-4">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading information...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="delete">Delete</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {/* Current event information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">This Practice Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {DateTime.fromJSDate(eventInfo.start, { zone: 'America/New_York' }).toFormat('ccc, d LLL yyyy - h:mm a')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{coachInfo?.name || 'No coach assigned'}</span>
                    </div>
                    
                    {session && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Days: {formatDaysOfWeek(session.daysofweek || '')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Upcoming occurrences */}
                {upcomingOccurrences.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upcoming Practices</CardTitle>
                      <CardDescription>
                        The next {upcomingOccurrences.length} practices in this series
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {upcomingOccurrences.map((occurrence, index) => (
                          <div key={index} className="flex items-center justify-between py-1">
                            <span className="text-sm">
                              {occurrence.toFormat('ccc, d LLL')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {occurrence.toFormat('h:mm a')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Participants */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participants
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">
                        {parents.length} parent{parents.length !== 1 ? 's' : ''} in the list
                      </span>
                    </div>
                    
                    {parents.length === 0 && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">No participants registered in this team</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="edit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Edit Practice Series</CardTitle>
                    <CardDescription>
                      Changes will affect all future practices in this series
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startdate">Start Date</Label>
                        <Input
                          id="startdate"
                          type="date"
                          value={editForm.startdate}
                          onChange={(e) => setEditForm(prev => ({ ...prev, startdate: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="enddate">End Date</Label>
                        <Input
                          id="enddate"
                          type="date"
                          value={editForm.enddate}
                          onChange={(e) => setEditForm(prev => ({ ...prev, enddate: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="starttime">Start Time</Label>
                        <Input
                          id="starttime"
                          type="time"
                          value={editForm.starttime}
                          onChange={(e) => setEditForm(prev => ({ ...prev, starttime: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="endtime">End Time</Label>
                        <Input
                          id="endtime"
                          type="time"
                          value={editForm.endtime}
                          onChange={(e) => setEditForm(prev => ({ ...prev, endtime: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="daysofweek">Days of the Week</Label>
                      <Input
                        id="daysofweek"
                        placeholder="e.g: monday,wednesday,friday or lunes,miércoles,viernes"
                        value={editForm.daysofweek}
                        onChange={(e) => setEditForm(prev => ({ ...prev, daysofweek: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separate with commas. Examples: "monday,wednesday,friday" or "lunes,miércoles,viernes"
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="coachid">Assigned Coach</Label>
                      <Select
                        value={editForm.coachid}
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, coachid: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select coach" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No coach assigned</SelectItem>
                          {availableCoaches.map((coach) => (
                            <SelectItem key={coach.id} value={coach.id}>
                              {coach.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} disabled={saving} className="flex-1">
                        {saving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Custom Email Editor</CardTitle>
                    <CardDescription>
                      Customize the email that will be sent to all team parents
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email-subject">Email Subject</Label>
                      <Input
                        id="email-subject"
                        value={emailTemplate.subject}
                        onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Email subject"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email-html">Email HTML Content</Label>
                      <Textarea
                        id="email-html"
                        value={emailTemplate.html}
                        onChange={(e) => setEmailTemplate(prev => ({ ...prev, html: e.target.value }))}
                        placeholder="Email HTML content"
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="p-3 bg-blue-50 text-blue-700 rounded-md">
                      <p className="text-sm font-medium mb-2">Available variables:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><code>{'{parentName}'}</code> - Parent name</div>
                        <div><code>{'{studentName}'}</code> - Student name</div>
                        <div><code>{'{teamName}'}</code> - Team name</div>
                        <div><code>{'{practiceDate}'}</code> - Practice date</div>
                        <div><code>{'{practiceTime}'}</code> - Practice time</div>
                        <div><code>{'{coachName}'}</code> - Coach name</div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <Label className="text-sm font-medium">Email preview:</Label>
                      <div 
                        className="mt-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: emailTemplate.html
                            .replace(/{parentName}/g, 'John Doe')
                            .replace(/{studentName}/g, 'Jane Doe')
                            .replace(/{teamName}/g, teamName)
                            .replace(/{practiceDate}/g, 'Monday, January 15th')
                            .replace(/{practiceTime}/g, '3:00 PM - 4:30 PM')
                            .replace(/{coachName}/g, coachInfo?.name || 'Not assigned')
                        }}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button 
                        onClick={handleSendEmail}
                        disabled={sendingEmail || parents.length === 0}
                        className="flex-1"
                      >
                        {sendingEmail ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        Send to {parents.length} parent{parents.length !== 1 ? 's' : ''}
                      </Button>
                    </div>

                    {parents.length === 0 && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">No participants registered in this team</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="delete" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                      <Trash2 className="h-5 w-5" />
                      Cancel This Practice
                    </CardTitle>
                    <CardDescription>
                      This will cancel only this specific practice date
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-md">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-destructive">
                            Warning: This action cannot be undone
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Canceling this practice will:
                          </p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                            <li>Remove only this specific practice date ({eventInfo ? new Date(eventInfo.start).toLocaleDateString() : 'selected date'})</li>
                            <li>Keep all other practices in the series</li>
                            <li>This can be restored later if needed</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {session && eventInfo && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Practice to be canceled:</p>
                        <div className="bg-muted p-3 rounded-md space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Team:</span>
                            <span className="text-sm">{teamName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Date:</span>
                            <span className="text-sm">{new Date(eventInfo.start).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Time:</span>
                            <span className="text-sm">{session.starttime} - {session.endtime}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Coach:</span>
                            <span className="text-sm">{coachInfo?.name || 'No coach assigned'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {!confirmDelete ? (
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => setConfirmDelete(true)}
                          variant="destructive"
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel This Practice
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-4">
                        <p className="text-sm font-medium text-center">
                          Are you absolutely sure you want to cancel this practice?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setConfirmDelete(false)}
                            variant="outline"
                            className="flex-1"
                            disabled={deleting}
                          >
                            No, Keep Practice
                          </Button>
                          <Button
                            onClick={handleCancelOccurrence}
                            variant="destructive"
                            className="flex-1"
                            disabled={deleting}
                          >
                            {deleting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Yes, Cancel Practice
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
