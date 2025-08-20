"use client"

import React, { useState, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import luxonPlugin from '@fullcalendar/luxon'
import { DateTime } from 'luxon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Filter, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

import { expandOccurrences } from '@/utils/schedule'
import { 
  fetchCalendarData,
  SessionRow 
} from '@/lib/calendar/supabase-client'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  extendedProps: {
    sessionid: string
    teamid: string
    coachid?: string | null
    teamName: string
    originalOccurrence: string // YYYYMMDD
  }
  backgroundColor?: string
  borderColor?: string
  textColor?: string
}

interface CalendarWeekProps {
  onEventClick?: (eventInfo: {
    sessionid: string
    teamid: string
    start: Date
    end: Date
    teamName: string
    occurrence: string
  }) => void
  className?: string
}

export default function CalendarWeek({ onEventClick, className }: CalendarWeekProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedCoach, setSelectedCoach] = useState<string>('all')
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [coaches, setCoaches] = useState<Array<{ id: string; name: string }>>([])
  const [isMobile, setIsMobile] = useState(false)
  const [currentView, setCurrentView] = useState<'timeGridWeek' | 'timeGridDay'>('timeGridWeek')
  
  const { toast } = useToast()

  // Detectar móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
      setCurrentView(window.innerWidth < 640 ? 'timeGridDay' : 'timeGridWeek')
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Generar colores únicos para equipos
  const getTeamColor = useCallback((teamid: string) => {
    const colors = [
      { bg: '#3B82F6', border: '#2563EB', text: '#FFFFFF' }, // Blue
      { bg: '#EF4444', border: '#DC2626', text: '#FFFFFF' }, // Red
      { bg: '#10B981', border: '#059669', text: '#FFFFFF' }, // Green
      { bg: '#F59E0B', border: '#D97706', text: '#FFFFFF' }, // Yellow
      { bg: '#8B5CF6', border: '#7C3AED', text: '#FFFFFF' }, // Purple
      { bg: '#EC4899', border: '#DB2777', text: '#FFFFFF' }, // Pink
      { bg: '#06B6D4', border: '#0891B2', text: '#FFFFFF' }, // Cyan
      { bg: '#84CC16', border: '#65A30D', text: '#FFFFFF' }, // Lime
    ]
    
    const hash = teamid.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }, [])

  // Cargar datos optimizado
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar todos los datos en paralelo
      const { sessions, teamNames, coaches: coachesData } = await fetchCalendarData()
      
      setCoaches(coachesData)

      // Procesar eventos - mucho más rápido sin llamadas individuales
      const calendarEvents: CalendarEvent[] = []
      const uniqueTeams = new Set<string>()

      for (const session of sessions) {
        const teamName = teamNames[session.teamid] || `Team ${session.teamid}`
        uniqueTeams.add(session.teamid)
        
        const occurrences = expandOccurrences(session)
        const teamColor = getTeamColor(session.teamid)
        
        for (const occurrence of occurrences) {
          calendarEvents.push({
            id: `${session.sessionid}-${occurrence.ymd}`,
            title: teamName,
            start: occurrence.start,
            end: occurrence.end,
            backgroundColor: teamColor.bg,
            borderColor: teamColor.border,
            textColor: teamColor.text,
            extendedProps: {
              sessionid: session.sessionid,
              teamid: session.teamid,
              coachid: session.coachid,
              teamName,
              originalOccurrence: occurrence.ymd
            }
          })
        }
      }

      // Crear lista de equipos únicos - sin llamadas adicionales
      const teamsData = Array.from(uniqueTeams).map(teamid => ({
        id: teamid,
        name: teamNames[teamid] || `Team ${teamid}`
      })).sort((a, b) => a.name.localeCompare(b.name))
      
      setTeams(teamsData)
      setEvents(calendarEvents)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar datos'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [getTeamColor, toast])

  // Efecto inicial
  useEffect(() => {
    loadData()
  }, [loadData])

  // Filtrar eventos
  const filteredEvents = events.filter(event => {
    const teamMatch = selectedTeam === 'all' || event.extendedProps.teamid === selectedTeam
    const coachMatch = selectedCoach === 'all' || event.extendedProps.coachid === selectedCoach
    return teamMatch && coachMatch
  })

  // Manejar click en evento
  const handleEventClick = useCallback((clickInfo: any) => {
    const { extendedProps } = clickInfo.event
    
    if (onEventClick) {
      onEventClick({
        sessionid: extendedProps.sessionid,
        teamid: extendedProps.teamid,
        start: clickInfo.event.start,
        end: clickInfo.event.end,
        teamName: extendedProps.teamName,
        occurrence: extendedProps.originalOccurrence
      })
    }
  }, [onEventClick])

  // Función para refrescar
  const handleRefresh = useCallback(() => {
    loadData()
  }, [loadData])

  // Función para cambiar vista en móvil
  const toggleView = useCallback(() => {
    setCurrentView(prev => prev === 'timeGridWeek' ? 'timeGridDay' : 'timeGridWeek')
  }, [])

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario de Prácticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Skeleton para filtros */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="h-9 w-32 bg-muted rounded animate-pulse" />
                <div className="h-9 w-32 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-20 bg-muted rounded animate-pulse" />
                <div className="h-9 w-9 bg-muted rounded animate-pulse" />
              </div>
            </div>
            
            {/* Skeleton para calendario */}
            <div className="space-y-2">
              <div className="h-12 bg-muted rounded animate-pulse" />
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 21 }).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-center py-4">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Cargando prácticas...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario de Prácticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <p className="text-destructive text-center">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendario de Prácticas
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {/* Filtros */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Equipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los equipos</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedCoach} onValueChange={setSelectedCoach}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Coach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los coaches</SelectItem>
                  {coaches.map(coach => (
                    <SelectItem key={coach.id} value={coach.id}>
                      {coach.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {isMobile && (
                <Button
                  onClick={toggleView}
                  variant="outline"
                  size="sm"
                >
                  {currentView === 'timeGridWeek' ? 'Vista Día' : 'Vista Semana'}
                </Button>
              )}
              
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {filteredEvents.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">
              {filteredEvents.length} práctica{filteredEvents.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="w-full">
          <FullCalendar
            plugins={[timeGridPlugin, interactionPlugin, luxonPlugin]}
            initialView={currentView}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: isMobile ? '' : 'timeGridWeek,timeGridDay'
            }}
            timeZone="America/New_York"
            allDaySlot={false}
            slotMinTime="07:00:00"
            slotMaxTime="22:00:00"
            height="auto"
            events={filteredEvents}
            eventClick={handleEventClick}
            firstDay={1}
            expandRows={true}
            nowIndicator={true}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              omitZeroMinute: false,
              meridiem: 'short'
            }}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            locale="es"
            buttonText={{
              today: 'Hoy',
              week: 'Semana',
              day: 'Día'
            }}
            eventDisplay="block"
            eventMaxStack={3}
            dayMaxEvents={false}
            moreLinkClick="popover"
            eventClassNames="cursor-pointer"
            dayCellClassNames="hover:bg-muted/50"
            slotEventOverlap={false}
          />
        </div>
        
        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2" />
            <p>No hay prácticas programadas</p>
            {(selectedTeam !== 'all' || selectedCoach !== 'all') && (
              <p className="text-sm">Intenta cambiar los filtros</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
