"use client"

import { Mail, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useActivity } from "@/lib/hooks/use-activity"
import { Skeleton } from "@/components/ui/skeleton"

// Define a mapping of activity types to icons
const iconMap = {
  email: Mail,
  activity: Activity,
}

export function ActivityFeed() {
  const { data, isLoading, error, refetch } = useActivity()

  // Default activities to show while loading
  const defaultActivities = [
    {
      id: "1",
      title: "Campaña de Email",
      description: '"Oferta Especial" - Enviado el 13 de Abril, 2025',
      timestamp: "2025-04-13",
      type: "email",
      data: {
        delivered: "1.4k",
        openRate: "55%",
        clickRate: "1%",
      },
    },
    {
      id: "2",
      title: "Actualización de rendimiento",
      description: "Han pasado 15 días desde el último email enviado",
      timestamp: "2025-04-14",
      type: "activity",
      data: {},
    },
  ]

  const activities = data?.items || defaultActivities

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Feed de actividades</CardTitle>
          <CardDescription>Actualizaciones recientes</CardDescription>
        </div>
        <Tabs defaultValue="priority" className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="priority">Prioridad</TabsTrigger>
            <TabsTrigger value="date">Fecha</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="grid gap-1 w-full">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
                <div className="mt-2 flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="grid gap-1 w-full">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
                <div className="mt-2">
                  <Skeleton className="h-9 w-36" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity) => {
              const Icon = iconMap[activity.type as keyof typeof iconMap] || Activity

              return (
                <div key={activity.id}>
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="grid gap-1">
                      <div className="font-semibold">{activity.title}</div>
                      <div className="text-sm text-muted-foreground">{activity.description}</div>
                      {activity.type === "email" && activity.data && (
                        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                          <div>Entregados: {activity.data.delivered}</div>
                          <div>Tasa de apertura: {activity.data.openRate}</div>
                          <div>Tasa de clics: {activity.data.clickRate}</div>
                        </div>
                      )}
                      {activity.type === "activity" && (
                        <div className="mt-2">
                          <Button size="sm">Crear nueva campaña</Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {activity.id !== activities[activities.length - 1].id && <Separator className="my-4" />}
                </div>
              )
            })}
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">Error al cargar los datos: {error.message}</div>
        )}
      </CardContent>
    </Card>
  )
}
