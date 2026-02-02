"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Activity, Clock } from "lucide-react"
import { useAnalytics } from "@/lib/hooks/use-analytics"
import { Skeleton } from "@/components/ui/skeleton"

export function AnalyticsSection() {
  const { data, isLoading, error, refetch } = useAnalytics()

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sesiones de Hoy</CardTitle>
          <CardDescription>Resumen de actividad del día</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {isLoading ? "Cargando..." : "Actualizar"}
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Sesiones de Hoy */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
              <CardTitle className="text-sm font-medium">Sesiones de Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {data?.sessionsToday ?? 0}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Programadas para hoy
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Estudiantes Esperados */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
              <CardTitle className="text-sm font-medium">Estudiantes Esperados</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {data?.studentsExpected ?? 0}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Inscritos en sesiones de hoy
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Sesiones Activas */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
              <CardTitle className="text-sm font-medium">Sesiones Activas</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {data?.activeSessions ?? 0}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {data?.activeSessions === 0 ? "Ninguna en curso" : "En curso ahora"}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Próxima Sesión */}
          <Card className="border shadow-sm">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
              <CardTitle className="text-sm font-medium">Próxima Sesión</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {data?.nextSessionTime || "—"}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {data?.nextSessionTime ? "Tiempo restante" : "No hay sesiones próximas"}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">Error al cargar los datos: {error.message}</div>
        )}
      </CardContent>
    </Card>
  )
}
