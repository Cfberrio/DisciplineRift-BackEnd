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
  AlertCircle
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
    subject: 'Recordatorio de Práctica - {teamName}',
    html: `
<h2>🏐 Recordatorio de Práctica</h2>
<p>Hola <strong>{parentName}</strong>,</p>

<p>Te recordamos que <strong>{studentName}</strong> tiene una práctica programada:</p>

<div style="background-color: #f0f8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
  <p><strong>📅 Equipo:</strong> {teamName}</p>
  <p><strong>📅 Fecha:</strong> {practiceDate}</p>
  <p><strong>⏰ Hora:</strong> {practiceTime}</p>
  <p><strong>👨‍💼 Coach:</strong> {coachName}</p>
</div>

<p>Por favor, asegúrate de que llegue 10 minutos antes del inicio.</p>

<p>¡Nos vemos en la práctica!</p>
<p><em>Sistema de Gestión de Prácticas</em></p>
    `.trim()
  })

  const { toast } = useToast()

  // Cargar datos cuando se abre el drawer
  useEffect(() => {
    if (open && eventInfo) {
      loadEventData()
    }
  }, [open, eventInfo])

  const loadEventData = async () => {
    if (!eventInfo) return
    
    try {
      setLoading(true)
      
      // Cargar todos los datos en paralelo para mayor velocidad
      const [sessionData, teamNameData, coachesData, parentsData] = await Promise.all([
        getSessionById(eventInfo.sessionid),
        getTeamName(eventInfo.teamid),
        getAvailableCoaches(),
        getParentsByTeam(eventInfo.teamid)
      ])
      
      if (!sessionData) {
        toast({
          title: "Error",
          description: "No se pudo cargar la información de la sesión",
          variant: "destructive"
        })
        return
      }
      
      setSession(sessionData)
      setTeamName(teamNameData)
      setAvailableCoaches(coachesData)
      setParents(parentsData)
      
      // Cargar información del coach si existe
      if (sessionData.coachid) {
        const coachData = await getCoachInfo(sessionData.coachid)
        setCoachInfo(coachData)
      } else {
        setCoachInfo(null)
      }
      
      // Inicializar formulario de edición
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
        description: "Error al cargar los datos del evento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Manejar guardado de cambios
  const handleSave = async () => {
    if (!session || !eventInfo) return
    
    // Validaciones
    if (!validateDaysOfWeek(editForm.daysofweek)) {
      toast({
        title: "Error de validación",
        description: "Los días de la semana no son válidos",
        variant: "destructive"
      })
      return
    }
    
    if (editForm.starttime >= editForm.endtime) {
      toast({
        title: "Error de validación", 
        description: "La hora de fin debe ser posterior a la hora de inicio",
        variant: "destructive"
      })
      return
    }
    
    if (new Date(editForm.startdate) > new Date(editForm.enddate)) {
      toast({
        title: "Error de validación",
        description: "La fecha de fin debe ser posterior a la fecha de inicio",
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
        title: "Éxito",
        description: "La sesión se ha actualizado correctamente"
      })
      
      setEditMode(false)
      
      // Recargar datos
      await loadEventData()
      
      // Notificar al padre para recargar el calendario
      if (onEventUpdated) {
        onEventUpdated()
      }
      
    } catch (error) {
      console.error('Error saving session:', error)
      toast({
        title: "Error",
        description: "Error al guardar los cambios",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Manejar envío de email personalizado
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
        throw new Error('Error al enviar emails')
      }
      
      const result = await response.json()
      
      toast({
        title: "Emails enviados",
        description: `Se enviaron ${result.sent} emails personalizados a los padres`
      })
      
      setShowEmailEditor(false)
      
    } catch (error) {
      console.error('Error sending email:', error)
      toast({
        title: "Error",
        description: "Error al enviar los emails",
        variant: "destructive"
      })
    } finally {
      setSendingEmail(false)
    }
  }

  // Obtener próximas ocurrencias
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
            Gestionar práctica del equipo
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
                <p className="text-sm text-muted-foreground">Cargando información...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Detalles</TabsTrigger>
                <TabsTrigger value="edit">Editar</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                {/* Información del evento actual */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información de esta práctica</CardTitle>
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
                      <span>{coachInfo?.name || 'Sin coach asignado'}</span>
                    </div>
                    
                    {session && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Días: {formatDaysOfWeek(session.daysofweek || '')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Próximas ocurrencias */}
                {upcomingOccurrences.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Próximas prácticas</CardTitle>
                      <CardDescription>
                        Las siguientes {upcomingOccurrences.length} prácticas de esta serie
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

                {/* Participantes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">
                        {parents.length} padre{parents.length !== 1 ? 's' : ''} en la lista
                      </span>
                    </div>
                    
                    {parents.length === 0 && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">No hay participantes registrados en este equipo</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="edit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Editar serie de prácticas</CardTitle>
                    <CardDescription>
                      Los cambios afectarán todas las prácticas futuras de esta serie
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startdate">Fecha de inicio</Label>
                        <Input
                          id="startdate"
                          type="date"
                          value={editForm.startdate}
                          onChange={(e) => setEditForm(prev => ({ ...prev, startdate: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="enddate">Fecha de fin</Label>
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
                        <Label htmlFor="starttime">Hora de inicio</Label>
                        <Input
                          id="starttime"
                          type="time"
                          value={editForm.starttime}
                          onChange={(e) => setEditForm(prev => ({ ...prev, starttime: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="endtime">Hora de fin</Label>
                        <Input
                          id="endtime"
                          type="time"
                          value={editForm.endtime}
                          onChange={(e) => setEditForm(prev => ({ ...prev, endtime: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="daysofweek">Días de la semana</Label>
                      <Input
                        id="daysofweek"
                        placeholder="ej: monday,wednesday,friday o lunes,miércoles,viernes"
                        value={editForm.daysofweek}
                        onChange={(e) => setEditForm(prev => ({ ...prev, daysofweek: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separar con comas. Ejemplos: "lunes,miércoles,viernes" o "monday,wednesday,friday"
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="coachid">Coach asignado</Label>
                      <Select
                        value={editForm.coachid}
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, coachid: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar coach" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin coach asignado</SelectItem>
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
                        Guardar cambios
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Editor de Email Personalizado</CardTitle>
                    <CardDescription>
                      Personaliza el email que se enviará a todos los padres del equipo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="email-subject">Asunto del email</Label>
                      <Input
                        id="email-subject"
                        value={emailTemplate.subject}
                        onChange={(e) => setEmailTemplate(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Asunto del email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email-html">Contenido HTML del email</Label>
                      <Textarea
                        id="email-html"
                        value={emailTemplate.html}
                        onChange={(e) => setEmailTemplate(prev => ({ ...prev, html: e.target.value }))}
                        placeholder="Contenido HTML del email"
                        rows={12}
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="p-3 bg-blue-50 text-blue-700 rounded-md">
                      <p className="text-sm font-medium mb-2">Variables disponibles:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><code>{'{parentName}'}</code> - Nombre del padre</div>
                        <div><code>{'{studentName}'}</code> - Nombre del estudiante</div>
                        <div><code>{'{teamName}'}</code> - Nombre del equipo</div>
                        <div><code>{'{practiceDate}'}</code> - Fecha de la práctica</div>
                        <div><code>{'{practiceTime}'}</code> - Hora de la práctica</div>
                        <div><code>{'{coachName}'}</code> - Nombre del coach</div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <Label className="text-sm font-medium">Vista previa del email:</Label>
                      <div 
                        className="mt-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: emailTemplate.html
                            .replace(/{parentName}/g, 'Juan Pérez')
                            .replace(/{studentName}/g, 'María Pérez')
                            .replace(/{teamName}/g, teamName)
                            .replace(/{practiceDate}/g, 'Lunes, 15 de Enero')
                            .replace(/{practiceTime}/g, '3:00 PM - 4:30 PM')
                            .replace(/{coachName}/g, coachInfo?.name || 'Sin asignar')
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
                        Enviar a {parents.length} padre{parents.length !== 1 ? 's' : ''}
                      </Button>
                    </div>

                    {parents.length === 0 && (
                      <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-md">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">No hay participantes registrados en este equipo</span>
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
