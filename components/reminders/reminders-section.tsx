'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Mail, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Send,
  History,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  UserX
} from 'lucide-react'
import { toast } from 'sonner'

interface SessionWithoutAttendance {
  session: {
    sessionid: string
    teamid: string
    startdate: string
    enddate: string
    starttime: string
    endtime: string
    daysofweek: string
    repeat: string
    coachid: string
  }
  coach: {
    id: string
    name: string
    email: string
  }
  team: {
    teamid: string
    name: string
    description?: string
  }
}

interface ReminderHistory {
  id: string
  type: string
  recipient: string
  content: string
  date: string
}

interface StudentWithMissingAttendance {
  student: {
    studentid: string
    firstname: string
    lastname: string
    parentid: string
  }
  parent: {
    parentid: string
    firstname: string
    lastname: string
    email: string
    phone?: string
  }
  session: {
    sessionid: string
    teamid: string
    startdate: string
    enddate: string
    starttime: string
    endtime: string
    daysofweek: string
    repeat: string
    coachid: string
  }
  team: {
    teamid: string
    name: string
    description?: string
  }
}

interface ReminderResult {
  success: boolean
  sent: number
  failed: number
  errors: string[]
  details: Array<{
    coach: string
    team: string
    email: string
    success: boolean
    error?: string
  }>
}

export default function RemindersSection() {
  const [pendingSessions, setPendingSessions] = useState<SessionWithoutAttendance[]>([])
  const [studentsWithMissingAttendance, setStudentsWithMissingAttendance] = useState<StudentWithMissingAttendance[]>([])
  const [history, setHistory] = useState<ReminderHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendingParentNotifications, setSendingParentNotifications] = useState(false)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  // Cargar datos iniciales
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reminders/send')
      const data = await response.json()
      
      if (data.success) {
        setPendingSessions(data.data.pendingSessions || [])
        setStudentsWithMissingAttendance(data.data.studentsWithMissingAttendance || [])
        setHistory(data.data.history || [])
      } else {
        toast.error('Error loading reminder data')
      }
    } catch (error) {
      console.error('Error loading reminder data:', error)
      toast.error('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  const sendReminders = async () => {
    setSending(true)
    try {
      const response = await fetch('/api/reminders/send', {
        method: 'POST'
      })
      
      const result: ReminderResult = await response.json()
      
      if (result.success) {
        toast.success(`Reminders sent successfully. ${result.sent} emails sent.`)
        // Recargar datos para actualizar la vista
        await loadData()
      } else {
        toast.warning(`Process completed with warnings. ${result.sent} sent, ${result.failed} failed.`)
        // Mostrar errores específicos
        result.errors.forEach(error => {
          toast.error(error)
        })
      }
    } catch (error) {
      console.error('Error sending reminders:', error)
      toast.error('Error sending reminders')
    } finally {
      setSending(false)
    }
  }

  const sendParentNotifications = async () => {
    setSendingParentNotifications(true)
    try {
      const response = await fetch('/api/reminders/send-parent-notifications', {
        method: 'POST'
      })
      
      const result: ReminderResult = await response.json()
      
      if (result.success) {
        toast.success(`Parent notifications sent successfully. ${result.sent} emails sent.`)
        // Recargar datos para actualizar la vista
        await loadData()
      } else {
        toast.warning(`Process completed with warnings. ${result.sent} sent, ${result.failed} failed.`)
        // Mostrar errores específicos
        result.errors.forEach(error => {
          toast.error(error)
        })
      }
    } catch (error) {
      console.error('Error sending parent notifications:', error)
      toast.error('Error sending parent notifications')
    } finally {
      setSendingParentNotifications(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Group history by date
  const groupedHistory = () => {
    const grouped = history.reduce((acc, record) => {
      // Parse the ISO date string and extract just the date part (YYYY-MM-DD)
      const dateStr = new Date(record.date).toISOString().split('T')[0]
      if (!acc[dateStr]) {
        acc[dateStr] = []
      }
      acc[dateStr].push(record)
      return acc
    }, {} as Record<string, ReminderHistory[]>)

    // Sort dates in descending order (most recent first)
    const sortedDates = Object.keys(grouped).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    )

    return { grouped, sortedDates }
  }

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDates(newExpanded)
  }

  const formatHistoryDate = (dateString: string) => {
    // Parse the date string (YYYY-MM-DD format) and format it properly
    const date = new Date(dateString + 'T00:00:00') // Add time to avoid timezone issues
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reminder data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reminders</h1>
          <p className="text-gray-600 mt-2">
            Send reminders to coaches and notifications to parents about attendance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={sendReminders}
            disabled={sending || pendingSessions.length === 0}
            className="min-w-[140px]"
          >
            {sending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Coach Reminders
              </>
            )}
          </Button>
          <Button
            onClick={sendParentNotifications}
            disabled={sendingParentNotifications || studentsWithMissingAttendance.length === 0}
            variant="secondary"
            className="min-w-[180px]"
          >
            {sendingParentNotifications ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <UserX className="h-4 w-4 mr-2" />
                Send Parent Notifications
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {pendingSessions.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Excellent! No pending attendance sessions for today.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Found {pendingSessions.length} session(s) without attendance recorded for today.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Coach Reminders ({pendingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="parent-notifications" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Parent Notifications ({studentsWithMissingAttendance.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Sessions Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingSessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending sessions</h3>
                <p className="text-muted-foreground text-center">
                  No coaches need reminders to complete attendance today.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingSessions.map((sessionData, index) => (
                <Card key={`${sessionData.session.sessionid}-${index}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {sessionData.team.name}
                      </CardTitle>
                      <Badge variant="destructive">Pending</Badge>
                    </div>
                    <CardDescription>
                      {sessionData.team.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">COACH</h4>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{sessionData.coach.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{sessionData.coach.email}</p>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">SESSION</h4>
                        <p className="text-sm">
                          {formatDate(sessionData.session.startdate)}
                        </p>
                        <p className="text-sm">
                          {formatTime(sessionData.session.starttime)} - {formatTime(sessionData.session.endtime)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {sessionData.session.daysofweek}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Parent Notifications Tab */}
        <TabsContent value="parent-notifications" className="space-y-4">
          {studentsWithMissingAttendance.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No missing attendance</h3>
                <p className="text-muted-foreground text-center">
                  All students have attendance recorded for today.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {studentsWithMissingAttendance.map((studentData, index) => (
                <Card key={`${studentData.student.studentid}-${index}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <UserX className="h-5 w-5" />
                        {studentData.student.firstname} {studentData.student.lastname}
                      </CardTitle>
                      <Badge variant="destructive">Absent</Badge>
                    </div>
                    <CardDescription>
                      {studentData.team.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">PARENT</h4>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{studentData.parent.firstname} {studentData.parent.lastname}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{studentData.parent.email}</p>
                        {studentData.parent.phone && (
                          <p className="text-sm text-muted-foreground">{studentData.parent.phone}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">SESSION</h4>
                        <p className="text-sm font-medium">{studentData.team.name}</p>
                        <p className="text-sm">
                          {formatDate(studentData.session.startdate)}
                        </p>
                        <p className="text-sm">
                          {formatTime(studentData.session.starttime)} - {formatTime(studentData.session.endtime)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {studentData.session.daysofweek}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No history</h3>
                <p className="text-muted-foreground text-center">
                  No reminders have been sent yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(() => {
                const { grouped, sortedDates } = groupedHistory()
                return sortedDates.map((date) => (
                  <Card key={date}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleDateExpansion(date)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{formatHistoryDate(date)}</CardTitle>
                          <CardDescription>
                            {grouped[date].length} reminder{grouped[date].length !== 1 ? 's' : ''} sent
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{grouped[date].length}</Badge>
                          {expandedDates.has(date) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {expandedDates.has(date) && (
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {grouped[date]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((record) => (
                            <div key={record.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-sm">{record.recipient}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {record.type}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{record.content}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(record.date).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              })()}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
