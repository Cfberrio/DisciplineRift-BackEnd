"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface Team {
  teamid: string
  name: string
  schoolid: number
  description: string
  price: number
  participants: number
  isactive: boolean
  isongoing: boolean
  school?: {
    name: string
    location: string
  }
  sessions?: {
    daysofweek: string
  }[]
}

interface WeekdayGroup {
  weekday: string
  teams: Team[]
}

interface WeekdayTeamSelectorProps {
  onTeamSelect: (teamId: string | null) => void
  selectedTeamId?: string | null
  seasonType: 'current' | 'upcoming'
}

const WEEKDAYS_MAP: Record<string, string> = {
  'monday': 'Lunes',
  'tuesday': 'Martes',
  'wednesday': 'Miércoles',
  'thursday': 'Jueves',
  'friday': 'Viernes',
  'saturday': 'Sábado',
  'sunday': 'Domingo',
  'mon': 'Lunes',
  'tue': 'Martes',
  'wed': 'Miércoles',
  'thu': 'Jueves',
  'fri': 'Viernes',
  'sat': 'Sábado',
  'sun': 'Domingo'
}

const WEEKDAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function WeekdayTeamSelector({ onTeamSelect, selectedTeamId, seasonType }: WeekdayTeamSelectorProps) {
  const [weekdayGroups, setWeekdayGroups] = useState<WeekdayGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWeekday, setSelectedWeekday] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeamsGroupedByWeekday = async () => {
      try {
        setIsLoading(true)
        
        // Fetch teams with sessions
        const response = await fetch("/api/teams?include=sessions")
        
        if (!response.ok) {
          throw new Error("Error al obtener los equipos")
        }
        
        const allTeams: Team[] = await response.json()
        
        // Filter teams based on season type
        const activeTeams = allTeams.filter((team: Team) => {
          if (seasonType === 'current') {
            // Current season: active but not ongoing
            return team.isactive === true && team.isongoing === false
          } else {
            // Upcoming season: active and ongoing
            return team.isactive === true && team.isongoing === true
          }
        })

        // Group teams by weekday
        const groupMap = new Map<string, Team[]>()
        
        activeTeams.forEach((team) => {
          if (team.sessions && team.sessions.length > 0) {
            team.sessions.forEach((session) => {
              if (session.daysofweek) {
                // Parse days of week (can be comma-separated)
                const days = session.daysofweek.toLowerCase().split(',').map(d => d.trim())
                
                days.forEach((day) => {
                  // Normalize day name
                  const normalizedDay = WEEKDAYS_MAP[day] || day
                  
                  if (!groupMap.has(normalizedDay)) {
                    groupMap.set(normalizedDay, [])
                  }
                  
                  // Avoid duplicates
                  const existingTeams = groupMap.get(normalizedDay)!
                  if (!existingTeams.find(t => t.teamid === team.teamid)) {
                    existingTeams.push(team)
                  }
                })
              }
            })
          } else {
            // Teams without sessions go to "Sin día asignado"
            const unassignedKey = "Sin día asignado"
            if (!groupMap.has(unassignedKey)) {
              groupMap.set(unassignedKey, [])
            }
            groupMap.get(unassignedKey)!.push(team)
          }
        })

        // Convert map to sorted array
        const groups: WeekdayGroup[] = []
        
        // Add weekdays in order
        WEEKDAY_ORDER.forEach((day) => {
          const spanishDay = WEEKDAYS_MAP[day]
          if (groupMap.has(spanishDay)) {
            groups.push({
              weekday: spanishDay,
              teams: groupMap.get(spanishDay)!
            })
            groupMap.delete(spanishDay)
          }
        })
        
        // Add remaining groups (like "Sin día asignado")
        groupMap.forEach((teams, weekday) => {
          groups.push({ weekday, teams })
        })

        setWeekdayGroups(groups)
        setError(null)
      } catch (err) {
        console.error("Error fetching teams:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeamsGroupedByWeekday()
  }, [seasonType])

  const handleTeamClick = (teamId: string) => {
    if (selectedTeamId === teamId) {
      onTeamSelect(null)
    } else {
      onTeamSelect(teamId)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Label>Seleccionar Equipo por Día de la Semana</Label>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Seleccionar Equipo por Día de la Semana</Label>
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          Error: {error}
        </div>
      </div>
    )
  }

  if (weekdayGroups.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Seleccionar Equipo por Día de la Semana</Label>
        <p className="text-sm text-muted-foreground">
          No hay equipos activos disponibles para mensajería.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Seleccionar Equipo por Día de la Semana
      </Label>
      <p className="text-sm text-muted-foreground">
        Los equipos están agrupados por los días en que tienen sesiones programadas.
      </p>

      <div className="space-y-3">
        {weekdayGroups.map((group) => (
          <Card key={group.weekday} className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {group.weekday}
                  <Badge variant="secondary" className="ml-2">
                    {group.teams.length} {group.teams.length === 1 ? 'equipo' : 'equipos'}
                  </Badge>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {group.teams.map((team) => (
                  <button
                    key={team.teamid}
                    onClick={() => handleTeamClick(team.teamid)}
                    className={cn(
                      "p-3 rounded-lg border-2 text-left transition-all hover:shadow-md",
                      selectedTeamId === team.teamid
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{team.name}</span>
                      {team.school && (
                        <span className="text-xs text-muted-foreground">
                          {team.school.name} - {team.school.location}
                        </span>
                      )}
                      {team.participants > 0 && (
                        <Badge variant="outline" className="w-fit text-xs">
                          {team.participants} participantes
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTeamId && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-700 font-medium">
            Equipo seleccionado - Continúa al siguiente paso
          </span>
        </div>
      )}
    </div>
  )
}

