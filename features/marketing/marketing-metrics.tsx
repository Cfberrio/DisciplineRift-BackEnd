"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMarketingMetrics } from "@/lib/hooks/use-marketing"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export function MarketingMetrics() {
  const [period, setPeriod] = useState("30days")
  const { metrics, isLoading, error, refetch } = useMarketingMetrics(period)

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    refetch(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Métricas de Email Marketing</h2>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 7 días</SelectItem>
              <SelectItem value="30days">Últimos 30 días</SelectItem>
              <SelectItem value="90days">Últimos 90 días</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Tabs defaultValue="bar" className="w-[200px]">
            <TabsList>
              <TabsTrigger value="bar">
                <BarChart className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="line">
                <LineChart className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="pie">
                <PieChart className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <Calendar className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-4 w-32 mb-4" />
                <Skeleton className="h-2 w-full rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
              <CardDescription>Total de emails enviados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.summary.sent.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {metrics?.summary.growth.sent > 0 ? "+" : ""}
                {metrics?.summary.growth.sent}% respecto al periodo anterior
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[75%]"></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Apertura</CardTitle>
              <CardDescription>Porcentaje de emails abiertos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.summary.openRate}%</div>
              <div className="text-xs text-muted-foreground">
                {metrics?.summary.growth.openRate > 0 ? "+" : ""}
                {metrics?.summary.growth.openRate}% respecto al periodo anterior
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${metrics?.summary.openRate || 0}%` }}></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Clics</CardTitle>
              <CardDescription>Porcentaje de clics en enlaces</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.summary.clickRate}%</div>
              <div className="text-xs text-muted-foreground">
                {metrics?.summary.growth.clickRate > 0 ? "+" : ""}
                {metrics?.summary.growth.clickRate}% respecto al periodo anterior
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${metrics?.summary.clickRate || 0}%` }}></div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
              <CardDescription>Porcentaje de conversiones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.summary.conversionRate}%</div>
              <div className="text-xs text-muted-foreground">
                {metrics?.summary.growth.conversionRate > 0 ? "+" : ""}
                {metrics?.summary.growth.conversionRate}% respecto al periodo anterior
              </div>
              <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${metrics?.summary.conversionRate || 0}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-1" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-4 w-full rounded-full mb-6" />
                <Skeleton className="h-5 w-32 mb-2" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Campaña</CardTitle>
              <CardDescription>Métricas de las últimas campañas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.campaigns.map((campaign) => (
                  <div key={campaign.id}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm">
                        <span className="font-medium">{campaign.openRate}%</span> apertura
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${campaign.openRate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Envíos</CardTitle>
              <CardDescription>Resumen de los últimos envíos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics?.deliveryStatus.delivered.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Entregados</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-amber-600">
                      {metrics?.deliveryStatus.pending.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Pendientes</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-red-600">
                      {metrics?.deliveryStatus.bounced.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Rebotados</div>
                  </div>
                </div>

                <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${metrics ? (metrics.deliveryStatus.delivered / (metrics.deliveryStatus.delivered + metrics.deliveryStatus.pending + metrics.deliveryStatus.bounced)) * 100 : 0}%`,
                    }}
                  ></div>
                  <div
                    className="h-full bg-amber-500"
                    style={{
                      width: `${metrics ? (metrics.deliveryStatus.pending / (metrics.deliveryStatus.delivered + metrics.deliveryStatus.pending + metrics.deliveryStatus.bounced)) * 100 : 0}%`,
                    }}
                  ></div>
                  <div
                    className="h-full bg-red-500"
                    style={{
                      width: `${metrics ? (metrics.deliveryStatus.bounced / (metrics.deliveryStatus.delivered + metrics.deliveryStatus.pending + metrics.deliveryStatus.bounced)) * 100 : 0}%`,
                    }}
                  ></div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="text-sm font-medium">Últimos Envíos</div>
                  <div className="space-y-2">
                    {metrics?.recentSends.map((send) => (
                      <div key={send.id} className="flex justify-between items-center text-sm">
                        <div>{send.name}</div>
                        <div className="text-muted-foreground">{send.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">Error al cargar las métricas: {error.message}</div>
      )}
    </div>
  )
}
