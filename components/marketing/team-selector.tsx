"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface Team {
  teamid: string
  name: string
  schoolid: number
  description: string
  price: number
  participants: number
  isactive: boolean
  isongoing: boolean
  status?: string | null
  school?: {
    name: string
    location: string
  }
}

interface TeamSelectorProps {
  onTeamSelect: (teamId: string | null) => void
  selectedTeamId?: string | null
}

export function TeamSelector({ onTeamSelect, selectedTeamId }: TeamSelectorProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActiveTeams = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/teams")
        
        if (!response.ok) {
          throw new Error("Error al obtener los equipos")
        }
        
        const allTeams = await response.json()
        // Filtrar solo equipos activos que NO están en curso
        const activeOngoingTeams = allTeams.filter((team: Team) => 
          team.isactive === true && team.isongoing === false
        )
        setTeams(activeOngoingTeams)
        setError(null)
      } catch (err) {
        console.error("Error fetching teams:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchActiveTeams()
  }, [])

  const handleValueChange = (value: string) => {
    if (value === "none") {
      onTeamSelect(null)
    } else {
      onTeamSelect(value)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Select Team</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Select Team</Label>
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="team-select">Select Team</Label>
      <Select value={selectedTeamId || "none"} onValueChange={handleValueChange}>
        <SelectTrigger id="team-select">
          <SelectValue placeholder="Choose a team..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">-- Select a team --</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.teamid} value={team.teamid}>
              <div className="flex flex-col">
                <span className="font-medium">{team.name}</span>
                {team.school && (
                  <span className="text-xs text-muted-foreground">
                    {team.school.name} - {team.school.location}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {teams.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No active teams available for messaging.
        </p>
      )}
    </div>
  )
}

