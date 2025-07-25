"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, Users, FileText } from "lucide-react"
import { useAnalytics } from "@/lib/hooks/use-analytics"
import { Skeleton } from "@/components/ui/skeleton"

// Define a mapping of icon types to components
const iconMap = {
  "trending-up": TrendingUp,
  "dollar-sign": DollarSign,
  users: Users,
  "file-text": FileText,
}

export function AnalyticsSection() {
  const { data, isLoading, error, refetch } = useAnalytics()

  // Default metrics to show while loading
  const defaultMetrics = [
    { id: "1", title: "Visitas", value: 0, change: 0, icon: "trending-up", secondaryValue: "0 hoy • 0 ayer" },
    { id: "2", title: "Ventas", value: 0, change: 0, icon: "dollar-sign", secondaryValue: "$0.00 hoy • $0.00 ayer" },
    { id: "3", title: "Reservas", value: 0, change: 0, icon: "users", secondaryValue: "0 hoy • 0 ayer" },
    { id: "4", title: "Formularios", value: 0, change: 0, icon: "file-text", secondaryValue: "0 hoy • 0 ayer" },
  ]

  const metrics = data?.metrics || defaultMetrics

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Analíticas</CardTitle>
          <CardDescription>Estadísticas de los últimos 30 días</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {isLoading ? "Cargando..." : "Actualizar"}
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = iconMap[metric.icon as keyof typeof iconMap] || TrendingUp

            return (
              <Card key={metric.id} className="border shadow-sm">
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <Icon className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-24 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold">
                          {metric.icon === "dollar-sign"
                            ? `$${metric.value.toLocaleString()}`
                            : metric.value.toLocaleString()}
                        </div>
                        <span className="text-xs text-green-600">+{metric.change}%</span>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{metric.secondaryValue}</div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">Error al cargar los datos: {error.message}</div>
        )}
      </CardContent>
    </Card>
  )
}
