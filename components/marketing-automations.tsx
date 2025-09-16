"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Copy, Trash, Clock, UserPlus, ShoppingCart, Bell, Tag } from "lucide-react"
import { AutomationEditor } from "@/components/automation-editor"
import { useState } from "react"

// Example data for automations
const automationData = [
  {
    id: 1,
    name: "New User Welcome",
    description: "Sends a welcome email when a user registers",
    trigger: "User Registration",
    triggerIcon: UserPlus,
    schedule: "Immediate",
    template: "Welcome",
    status: "active",
    lastRun: "Apr 12, 2025",
  },
  {
    id: 2,
    name: "Purchase Confirmation",
    description: "Sends a confirmation email after a purchase",
    trigger: "Purchase",
    triggerIcon: ShoppingCart,
    schedule: "Immediate",
    template: "Purchase Confirmation",
    status: "active",
    lastRun: "Apr 10, 2025",
  },
  {
    id: 3,
    name: "Appointment Reminder",
    description: "Sends a reminder 24h before a scheduled appointment",
    trigger: "Reminder",
    triggerIcon: Bell,
    schedule: "24h before",
    template: "Appointment Reminder",
    status: "active",
    lastRun: "Apr 5, 2025",
  },
  {
    id: 4,
    name: "Monthly Promotion",
    description: "Sends a monthly promotion to all users",
    trigger: "Promotions and Marketing",
    triggerIcon: Tag,
    schedule: "Recurring (Monthly)",
    template: "Monthly Promotion",
    status: "inactive",
    lastRun: "Apr 1, 2025",
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
            <h2 className="text-2xl font-semibold">Email Automations</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Automation
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
