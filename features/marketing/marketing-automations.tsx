"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Copy, Trash, Clock, UserPlus, ShoppingCart, Bell, Tag } from "lucide-react"
import { AutomationEditor } from "./automation-editor"
import { useState } from "react"
import { useAutomations } from "@/lib/hooks/use-marketing"
import { Skeleton } from "@/components/ui/skeleton"
import type { Automation } from "@/lib/api/types"

// Define a mapping of trigger types to icons
const triggerIconMap = {
  "Registro de usuarios": UserPlus,
  Compra: ShoppingCart,
  Recordatorio: Bell,
  "Promociones y marketing": Tag,
}

export function MarketingAutomations() {
  const { automations, isLoading, error, addAutomation, editAutomation, removeAutomation } = useAutomations()
  const [selectedAutomation, setSelectedAutomation] = useState<number | null>(null)

  const handleEditAutomation = (id: number) => {
    setSelectedAutomation(id)
  }

  const handleCloseEditor = () => {
    setSelectedAutomation(null)
  }

  const handleSaveAutomation = async (id: number, automationData: Partial<Automation>) => {
    try {
      await editAutomation(id, automationData)
      setSelectedAutomation(null)
    } catch (err) {
      console.error("Error saving automation:", err)
    }
  }

  const handleDeleteAutomation = async (id: number) => {
    try {
      await removeAutomation(id)
    } catch (err) {
      console.error("Error deleting automation:", err)
    }
  }

  const handleCreateAutomation = async () => {
    try {
      const newAutomation = await addAutomation({
        name: "Nueva Automatización",
        description: "Descripción de la nueva automatización",
        trigger: "Registro de usuarios",
        schedule: "Inmediato",
        template: "Bienvenida",
        templateId: 1,
        status: "inactive",
        lastRun: "Nunca",
      })

      setSelectedAutomation(newAutomation.id)
    } catch (err) {
      console.error("Error creating automation:", err)
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      await editAutomation(id, { status: newStatus })
    } catch (err) {
      console.error("Error toggling automation status:", err)
    }
  }

  if (selectedAutomation) {
    const automation = automations.find((a) => a.id === selectedAutomation)
    if (!automation) return null

    return (
      <AutomationEditor
        automation={automation}
        onClose={handleCloseEditor}
        onSave={(data) => handleSaveAutomation(automation.id, data)}
      />
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Automatizaciones de Email</h2>
        <Button onClick={handleCreateAutomation}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Automatización
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-40 mb-2" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-6 w-10" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6">
          {automations.map((automation) => {
            const TriggerIcon = triggerIconMap[automation.trigger as keyof typeof triggerIconMap] || Bell

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
                    <Switch
                      checked={automation.status === "active"}
                      onCheckedChange={() => handleToggleStatus(automation.id, automation.status)}
                    />
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
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteAutomation(automation.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
          Error al cargar las automatizaciones: {error.message}
        </div>
      )}
    </>
  )
}
