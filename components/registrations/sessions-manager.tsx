"use client"

import { useState } from "react"
import { useSessions, useDeleteSession, type Session } from "@/hooks/use-sessions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Clock, Calendar, User, Pencil, Trash2 } from "lucide-react"
import { SessionDialog } from "./session-dialog"
import { Skeleton } from "@/components/ui/skeleton"

interface SessionsManagerProps {
  teamId: string | null
  teamName?: string
}

const WEEKDAY_NAMES: Record<string, string> = {
  Monday: "Monday",
  Tuesday: "Tuesday",
  Wednesday: "Wednesday",
  Thursday: "Thursday",
  Friday: "Friday",
  Saturday: "Saturday",
  Sunday: "Sunday",
}

function formatTime(time: string) {
  try {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  } catch {
    return time
  }
}

function formatDate(date: string | null) {
  if (!date) return null
  try {
    // Agregar T00:00:00 para forzar interpretación local y evitar desfase de zona horaria
    const dateWithTime = date.includes('T') ? date : `${date}T00:00:00`
    return new Date(dateWithTime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return date
  }
}

export function SessionsManager({ teamId, teamName }: SessionsManagerProps) {
  const { data: sessions, isLoading, error, isError } = useSessions(teamId)
  const deleteSession = useDeleteSession()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [deletingSession, setDeletingSession] = useState<{
    id: string
    teamid: string
  } | null>(null)

  // Log sessions for debugging
  console.log("[SessionsManager] Team ID:", teamId)
  console.log("[SessionsManager] Sessions data:", sessions)
  console.log("[SessionsManager] Is loading:", isLoading)
  console.log("[SessionsManager] Is error:", isError)
  if (isError) {
    console.error("[SessionsManager] Error:", error)
  }

  // Helper function to get staff full name
  const getStaffFullName = (staff: any) => {
    if (!staff) return null
    if (staff.firstname && staff.lastname) {
      return `${staff.firstname} ${staff.lastname}`
    }
    return staff.name || null
  }

  if (!teamId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Select a team to manage sessions
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleDelete = async () => {
    if (!deletingSession) return
    await deleteSession.mutateAsync(deletingSession)
    setDeletingSession(null)
  }

  // Group sessions by day of week
  const sessionsByDay = sessions?.reduce(
    (acc, session) => {
      const days = session.daysofweek.split(",").map((d) => d.trim())
      days.forEach((day) => {
        if (!acc[day]) acc[day] = []
        acc[day].push(session)
      })
      return acc
    },
    {} as Record<string, Session[]>
  ) || {}

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>
                {teamName
                  ? `Manage session schedule for ${teamName}`
                  : "Configure days, times, and coaches"}
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingSession(null)
                setDialogOpen(true)
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No sessions configured</p>
              <p className="text-sm">Add your first session to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(WEEKDAY_NAMES).map(([key, dayName]) => {
                const daySessions = sessionsByDay[key]
                if (!daySessions || daySessions.length === 0) return null

                return (
                  <div key={key} className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {dayName}
                    </h3>
                    <div className="grid gap-3">
                      {daySessions.map((session) => (
                        <Card key={session.sessionid} className="shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                      {formatTime(session.starttime)} -{" "}
                                      {formatTime(session.endtime)}
                                    </span>
                                  </div>
                                  {session.staff && (
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        {getStaffFullName(session.staff)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {(session.startdate || session.enddate) && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {session.startdate
                                        ? formatDate(session.startdate)
                                        : "No start"}{" "}
                                      →{" "}
                                      {session.enddate
                                        ? formatDate(session.enddate)
                                        : "No end"}
                                    </span>
                                  </div>
                                )}

                                {session.daysofweek.includes(",") && (
                                  <div className="flex gap-1 flex-wrap">
                                    {session.daysofweek
                                      .split(",")
                                      .map((d) => d.trim())
                                      .map((day) => (
                                        <Badge
                                          key={day}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {day}
                                        </Badge>
                                      ))}
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingSession(session)
                                    setDialogOpen(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setDeletingSession({
                                      id: session.sessionid,
                                      teamid: session.teamid,
                                    })
                                  }
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <SessionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingSession(null)
        }}
        teamId={teamId}
        session={editingSession}
      />

      <AlertDialog
        open={!!deletingSession}
        onOpenChange={() => setDeletingSession(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


