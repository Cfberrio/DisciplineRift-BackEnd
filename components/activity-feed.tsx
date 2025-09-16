"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, TrendingUp, UserPlus, Calendar } from "lucide-react"

export function ActivityFeed() {
  const activities = [
    {
      id: 1,
      type: "email",
      title: "Email Campaign",
      description: '"Special Offer" - Sent on April 13, 2025',
      stats: "Delivered: 1.4k • Open rate: 55% • Click rate: 1%",
      icon: Mail,
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "performance",
      title: "Performance update",
      description: "15 days have passed since the last email was sent",
      icon: TrendingUp,
      time: "1 day ago",
    },
    {
      id: 3,
      type: "registration",
      title: "New registration",
      description: "María González registered for Youth Volleyball",
      icon: UserPlus,
      time: "2 days ago",
    },
    {
      id: 4,
      type: "event",
      title: "Scheduled event",
      description: "Spring Tournament - April 25",
      icon: Calendar,
      time: "3 days ago",
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
        <CardTitle className="text-lg">Activity Feed</CardTitle>
        <CardDescription>Recent updates</CardDescription>
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
