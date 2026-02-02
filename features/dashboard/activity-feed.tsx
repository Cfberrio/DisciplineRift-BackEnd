"use client"

import { UserPlus, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useActivity } from "@/lib/hooks/use-activity"
import { Skeleton } from "@/components/ui/skeleton"

export function ActivityFeed() {
  const { data, isLoading, error, refetch } = useActivity()

  const activities = data?.items || []

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Inscripciones recientes</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="grid gap-1 w-full">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                </div>
                {i < 3 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No hay actividad reciente</p>
            <p className="text-sm mt-2">Las inscripciones aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div key={activity.id}>
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="grid gap-1 flex-1">
                    <div className="font-semibold">{activity.studentName}</div>
                    <div className="text-sm text-muted-foreground">
                      Se inscribió en <span className="font-medium">{activity.teamName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {activity.relativeTime}
                    </div>
                  </div>
                </div>
                {index < activities.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">Error al cargar los datos: {error.message}</div>
        )}
      </CardContent>
    </Card>
  )
}
