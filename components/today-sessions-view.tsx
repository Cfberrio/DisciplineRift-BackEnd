"use client"

import { useState } from "react"
import { Calendar, ChevronDown, ChevronUp, RefreshCw, Users, Clock, Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTodaySessions } from "@/hooks/use-today-sessions"
import type { TodaySession, SessionStudent } from "@/lib/api/types"

function SessionRow({ session }: { session: TodaySession }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [students, setStudents] = useState<SessionStudent[] | null>(null)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)

  const handleToggle = async () => {
    if (!isExpanded && !students) {
      // Load students if not already loaded
      setIsLoadingStudents(true)
      try {
        const response = await fetch(`/api/sessions-today/${session.sessionId}/students`)
        if (response.ok) {
          const data = await response.json()
          setStudents(data.students)
        }
      } catch (error) {
        console.error("Error loading students:", error)
      } finally {
        setIsLoadingStudents(false)
      }
    }
    setIsExpanded(!isExpanded)
  }

  const statusColors = {
    active: "bg-green-100 text-green-800 border-green-200",
    upcoming: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-gray-100 text-gray-600 border-gray-200",
  }

  const statusLabels = {
    active: "Activa",
    upcoming: "Próxima",
    completed: "Completada",
  }

  return (
    <>
      <tr className="border-b hover:bg-blue-50 transition-colors cursor-pointer">
        <td className="px-4 py-4 text-sm font-medium whitespace-nowrap">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <div>{session.startTime}</div>
              <div className="text-xs text-gray-500">{session.endTime}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="font-semibold text-blue-600">{session.teamName}</div>
          </div>
        </td>
        <td className="px-4 py-4 hidden md:table-cell">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4 text-gray-400" />
            {session.schoolName}
          </div>
        </td>
        <td className="px-4 py-4" onClick={handleToggle}>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isLoadingStudents}
          >
            <Users className="h-4 w-4" />
            {session.studentCount} {session.studentCount === 1 ? "estudiante" : "estudiantes"}
            {isLoadingStudents ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        </td>
        <td className="px-4 py-4">
          <Badge variant="outline" className={statusColors[session.status]}>
            {statusLabels[session.status]}
          </Badge>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan={5} className="px-4 py-4">
            {isLoadingStudents ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : students && students.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {students.map((student) => (
                  <div
                    key={student.studentId}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm"
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {student.firstName[0]}{student.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        Grado {student.grade}
                        {student.level && ` • ${student.level}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                No hay estudiantes inscritos en esta sesión
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export function TodaySessionsView() {
  const { data, isLoading, error, refetch } = useTodaySessions()

  const currentDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const sessions = data?.sessions || []

  return (
    <Card className="w-full">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Sesiones de Hoy
            </CardTitle>
            <CardDescription className="text-base mt-1 capitalize">
              {currentDate}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-24" />
                <Skeleton className="h-12 flex-1" />
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-red-600 mb-2">Error al cargar las sesiones</div>
            <div className="text-sm text-gray-500">{error.message}</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No hay sesiones programadas para hoy
            </h3>
            <p className="text-sm text-gray-500">
              Las sesiones aparecerán aquí cuando estén programadas
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">
                    Escuela
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Estudiantes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <SessionRow key={session.sessionId} session={session} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
