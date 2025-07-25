import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart, Calendar } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function MarketingMetrics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Métricas de Email Marketing</h2>
        <div className="flex items-center gap-2">
          <Select defaultValue="30days">
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <CardDescription>Total de emails enviados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,543</div>
            <div className="text-xs text-muted-foreground">+12% respecto al periodo anterior</div>
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
            <div className="text-2xl font-bold">42.8%</div>
            <div className="text-xs text-muted-foreground">+3.2% respecto al periodo anterior</div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-500 w-[42.8%]"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Clics</CardTitle>
            <CardDescription>Porcentaje de clics en enlaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.4%</div>
            <div className="text-xs text-muted-foreground">-1.5% respecto al periodo anterior</div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 w-[12.4%]"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <CardDescription>Porcentaje de conversiones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <div className="text-xs text-muted-foreground">+0.8% respecto al periodo anterior</div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-[3.2%]"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Campaña</CardTitle>
            <CardDescription>Métricas de las últimas campañas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Bienvenida a Nuevos Usuarios</div>
                <div className="text-sm">
                  <span className="font-medium">68.5%</span> apertura
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[68.5%]"></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="font-medium">Confirmación de Compra</div>
                <div className="text-sm">
                  <span className="font-medium">92.1%</span> apertura
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[92.1%]"></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="font-medium">Recordatorio de Cita</div>
                <div className="text-sm">
                  <span className="font-medium">54.3%</span> apertura
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[54.3%]"></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="font-medium">Promoción Mensual</div>
                <div className="text-sm">
                  <span className="font-medium">32.7%</span> apertura
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[32.7%]"></div>
              </div>
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
                  <div className="text-2xl font-bold text-blue-600">2,345</div>
                  <div className="text-xs text-muted-foreground">Entregados</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-amber-600">198</div>
                  <div className="text-xs text-muted-foreground">Pendientes</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-red-600">42</div>
                  <div className="text-xs text-muted-foreground">Rebotados</div>
                </div>
              </div>

              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500 w-[90.7%]"></div>
                <div className="h-full bg-amber-500 w-[7.7%]"></div>
                <div className="h-full bg-red-500 w-[1.6%]"></div>
              </div>

              <div className="pt-4 space-y-2">
                <div className="text-sm font-medium">Últimos Envíos</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div>Promoción Mensual</div>
                    <div className="text-muted-foreground">12 Abr, 2025 - 10:30 AM</div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div>Recordatorio de Cita</div>
                    <div className="text-muted-foreground">10 Abr, 2025 - 09:15 AM</div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div>Confirmación de Compra</div>
                    <div className="text-muted-foreground">8 Abr, 2025 - 03:45 PM</div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div>Bienvenida a Nuevos Usuarios</div>
                    <div className="text-muted-foreground">5 Abr, 2025 - 11:20 AM</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
