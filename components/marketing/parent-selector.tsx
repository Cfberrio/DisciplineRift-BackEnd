"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Search, Users, Mail, Phone } from "lucide-react"

interface Student {
  studentid: string
  firstname: string
  lastname: string
  enrollmentid: string
  totalPaid: number
}

interface Parent {
  parentid: string
  firstname: string
  lastname: string
  email: string
  phone: string
  students: Student[]
}

interface ParentSelectorProps {
  teamId: string | null
  selectedParents: string[]
  onParentsChange: (parentIds: string[]) => void
}

export function ParentSelector({ teamId, selectedParents, onParentsChange }: ParentSelectorProps) {
  const [parents, setParents] = useState<Parent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!teamId) {
      setParents([])
      setError(null)
      setIsLoading(false)
      return
    }

    const fetchParents = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/teams/${teamId}/parents`)
        
        if (!response.ok) {
          console.error(`[CLIENT] Error fetching parents for team ${teamId}:`, {
            status: response.status,
            statusText: response.statusText,
            url: response.url
          })
          
          let errorMessage = `Error al obtener los padres del equipo (${response.status})`
          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            }
            console.error("[CLIENT] Server error details:", errorData)
          } catch (parseError) {
            console.error("[CLIENT] Could not parse error response:", parseError)
          }
          
          throw new Error(errorMessage)
        }
        
        const parentsData = await response.json()
        setParents(parentsData)
      } catch (err) {
        console.error("Error fetching parents:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
        setParents([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchParents()
  }, [teamId])

  // Filtrar padres por búsqueda
  const filteredParents = parents.filter((parent) =>
    `${parent.firstname} ${parent.lastname}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parent.students.some(student => 
      `${student.firstname} ${student.lastname}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleParentToggle = (parentId: string) => {
    const newSelected = selectedParents.includes(parentId)
      ? selectedParents.filter(id => id !== parentId)
      : [...selectedParents, parentId]
    
    onParentsChange(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedParents.length === filteredParents.length) {
      // Deseleccionar todos
      onParentsChange([])
    } else {
      // Seleccionar todos los padres filtrados
      onParentsChange(filteredParents.map(parent => parent.parentid))
    }
  }

  if (!teamId) {
    return (
      <div className="space-y-2">
        <Label>Select Parents</Label>
        <Card>
          <CardContent className="flex items-center justify-center h-24">
            <p className="text-muted-foreground">First select a team</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Select Parents</Label>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Select Parents</Label>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              Error: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>Seleccionar Padres</Label>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Parents
              </CardTitle>
              <CardDescription>
                {parents.length} parents with active students
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {selectedParents.length} selected
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredParents.length === 0}
              >
                {selectedParents.length === filteredParents.length ? "Deselect all" : "Select all"}
              </Button>
            </div>
          </div>
          
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or student..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredParents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              {searchQuery ? "No parents found matching the search" : "No parents available for this team"}
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {filteredParents.map((parent) => (
                  <div key={parent.parentid} className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <Checkbox
                      id={parent.parentid}
                      checked={selectedParents.includes(parent.parentid)}
                      onCheckedChange={() => handleParentToggle(parent.parentid)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <Label 
                        htmlFor={parent.parentid} 
                        className="text-sm font-medium cursor-pointer"
                      >
                        {parent.firstname} {parent.lastname}
                      </Label>
                      
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {parent.email}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {parent.phone}
                        </div>
                      </div>

                      {/* Mostrar estudiantes */}
                      <div className="mt-2">
                        <div className="text-xs text-muted-foreground mb-1">Students:</div>
                        <div className="flex flex-wrap gap-1">
                          {parent.students.map((student) => (
                            <Badge key={student.studentid} variant="secondary" className="text-xs">
                              {student.firstname} {student.lastname}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

