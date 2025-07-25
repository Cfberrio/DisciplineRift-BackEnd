"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Copy, Trash, Clock, UserPlus, ShoppingCart, Bell, Tag } from "lucide-react"
import { AutomationEditor } from "@/components/automation-editor"
import { useState } from "react"

// Datos de ejemplo para las automatizaciones
const automationData = [
  {
    id: 1,
    name: "Bienvenida a Nuevos Usuarios",
    description: "Envía un email de bienvenida cuando un usuario se registra",
    trigger: "Registro de usuarios",
    triggerIcon: UserPlus,
    schedule: "Inmediato",
    template: "Bienvenida",
    status: "active",
    lastRun: "12 Abr, 2025",
  },
  {
    id: 2,
    name: "Confirmación de Compra",
    description: "Envía un email de confirmación después de una compra",
    trigger: "Compra",
    triggerIcon: ShoppingCart,
    schedule: "Inmediato",
    template: "Confirmación de Compra",
    status: "active",
    lastRun: "10 Abr, 2025",
  },
  {
    id: 3,
    name: "Recordatorio de Cita",
    description: "Envía un recordatorio 24h antes de una cita programada",
    trigger: "Recordatorio",
    triggerIcon: Bell,
    schedule: "24h antes",
    template: "Recordatorio de Cita",
    status: "active",
    lastRun: "5 Abr, 2025",
  },
  {
    id: 4,
    name: "Promoción Mensual",
    description: "Envía una promoción mensual a todos los usuarios",
    trigger: "Promociones y marketing",
    triggerIcon: Tag,
    schedule: "Recurrente (Mensual)",
    template: "Promoción Mensual",
    status: "inactive",
    lastRun: "1 Abr, 2025",
  },
]

export function MarketingAutomations() {
  const [selectedAutomation, setSelectedAutomation] = useState<number | null>(null)

  const handleEditAutomation = (id: number) => {
    setSelectedAutomation(id)
  }

  const handleCloseEditor = () => {
    setSelectedAutomation(null)
  }

  return (
    <>
      {selectedAutomation ? (
        <AutomationEditor
          automation={automationData.find((a) => a.id === selectedAutomation)!}
          onClose={handleCloseEditor}
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Automatizaciones de Email</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Automatización
            </Button>
          </div>

          <div className="grid gap-6">
            {automationData.map((automation) => {
              const TriggerIcon = automation.triggerIcon
              return (
                <Card key={automation.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{automation.name}</CardTitle>
                          <Badge variant={automation.status === "active" ? "default" : "outline"}>
                            {automation.status === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <CardDescription>{automation.description}</CardDescription>
                      </div>
                      <Switch checked={automation.status === "active"} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <TriggerIcon className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">Disparador</div>
                          <div className="text-sm text-muted-foreground">{automation.trigger}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">Programación</div>
                          <div className="text-sm text-muted-foreground">{automation.schedule}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center">
                          <div className="h-3 w-3 rounded-full bg-blue-600"></div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Plantilla</div>
                          <div className="text-sm text-muted-foreground">{automation.template}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">Última ejecución: {automation.lastRun}</div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditAutomation(automation.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
