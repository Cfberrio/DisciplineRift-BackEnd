"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, UserPlus, ShoppingCart, Bell, Tag, Clock, FileIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Automation {
  id: number
  name: string
  description: string
  trigger: string
  triggerIcon: any
  schedule: string
  template: string
  status: string
  lastRun: string
}

interface AutomationEditorProps {
  automation: Automation
  onClose: () => void
}

export function AutomationEditor({ automation, onClose }: AutomationEditorProps) {
  const [automationName, setAutomationName] = useState(automation.name)
  const [automationDescription, setAutomationDescription] = useState(automation.description)
  const [automationStatus, setAutomationStatus] = useState(automation.status === "active")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-semibold">Editar Automatización</h2>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle>Detalles de la Automatización</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm">Estado:</span>
                <Switch checked={automationStatus} onCheckedChange={setAutomationStatus} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="automation-name">Nombre</Label>
                <Input
                  id="automation-name"
                  value={automationName}
                  onChange={(e) => setAutomationName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="automation-description">Descripción</Label>
                <Textarea
                  id="automation-description"
                  value={automationDescription}
                  onChange={(e) => setAutomationDescription(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración del Disparador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label>Tipo de Disparador</Label>
                <RadioGroup defaultValue={automation.trigger} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="Registro de usuarios" id="trigger-register" />
                    <Label htmlFor="trigger-register" className="flex items-center gap-2 cursor-pointer">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                      Registro de usuarios
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="Compra" id="trigger-purchase" />
                    <Label htmlFor="trigger-purchase" className="flex items-center gap-2 cursor-pointer">
                      <ShoppingCart className="h-4 w-4 text-green-600" />
                      Compra
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="Recordatorio" id="trigger-reminder" />
                    <Label htmlFor="trigger-reminder" className="flex items-center gap-2 cursor-pointer">
                      <Bell className="h-4 w-4 text-amber-600" />
                      Recordatorio
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="Promociones y marketing" id="trigger-promo" />
                    <Label htmlFor="trigger-promo" className="flex items-center gap-2 cursor-pointer">
                      <Tag className="h-4 w-4 text-purple-600" />
                      Promociones y marketing
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-2">
                <Label>Programación</Label>
                <RadioGroup defaultValue={automation.schedule} className="grid gap-4">
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="Inmediato" id="schedule-immediate" />
                    <Label htmlFor="schedule-immediate" className="cursor-pointer">
                      Inmediato
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="Diferido" id="schedule-delayed" />
                    <Label htmlFor="schedule-delayed" className="cursor-pointer">
                      Diferido
                    </Label>
                    <div className="ml-auto flex items-center gap-2">
                      <Input type="number" className="w-20" defaultValue="24" />
                      <Select defaultValue="hours">
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutos</SelectItem>
                          <SelectItem value="hours">Horas</SelectItem>
                          <SelectItem value="days">Días</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">después</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-3">
                    <RadioGroupItem value="Recurrente" id="schedule-recurring" />
                    <Label htmlFor="schedule-recurring" className="cursor-pointer">
                      Recurrente
                    </Label>
                    <div className="ml-auto flex items-center gap-2">
                      <Select defaultValue="monthly">
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diario</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Email Template</Label>
                <Select defaultValue={automation.template}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Welcome">Welcome</SelectItem>
                    <SelectItem value="Purchase Confirmation">Purchase Confirmation</SelectItem>
                    <SelectItem value="Appointment Reminder">Appointment Reminder</SelectItem>
                    <SelectItem value="Monthly Promotion">Monthly Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-md p-4 bg-muted/20">
                <div className="text-center text-muted-foreground">Preview of selected template</div>
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <FileIcon className="h-4 w-4" />
                  <span>Attachments will be included when sending this email</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
