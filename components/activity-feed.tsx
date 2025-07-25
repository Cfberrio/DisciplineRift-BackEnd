"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, TrendingUp, UserPlus, Calendar } from "lucide-react"

export function ActivityFeed() {
  const activities = [
    {
      id: 1,
      type: "email",
      title: "Campaña de Email",
      description: '"Oferta Especial" - Enviado el 13 de Abril, 2025',
      stats: "Entregados: 1.4k • Tasa de apertura: 55% • Tasa de clics: 1%",
      icon: Mail,
      time: "Hace 2 horas",
    },
    {
      id: 2,
      type: "performance",
      title: "Actualización de rendimiento",
      description: "Han pasado 15 días desde el último email enviado",
      icon: TrendingUp,
      time: "Hace 1 día",
    },
    {
      id: 3,
      type: "registration",
      title: "Nueva inscripción",
      description: "María González se inscribió en Voleibol Juvenil",
      icon: UserPlus,
      time: "Hace 2 días",
    },
    {
      id: 4,
      type: "event",
      title: "Evento programado",
      description: "Torneo de Primavera - 25 de Abril",
      icon: Calendar,
      time: "Hace 3 días",
    },
  ]

  const getIconColor = (type: string) => {
    switch (type) {
      case "email":
        return "text-blue-600 bg-blue-100"
      case "performance":
        return "text-green-600 bg-green-100"
      case "registration":
        return "text-purple-600 bg-purple-100"
      case "event":
        return "text-orange-600 bg-orange-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Feed de actividades</CardTitle>
        <CardDescription>Actualizaciones recientes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${getIconColor(activity.type)}`}>
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
              {activity.stats && <p className="text-xs text-gray-500 mt-1">{activity.stats}</p>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
