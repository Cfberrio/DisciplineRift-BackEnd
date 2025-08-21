"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

export function Schedule() {
  const router = useRouter()
  
  const events = [
    {
      id: 1,
      title: "Volleyball Training",
      time: "09:00 - 11:00",
      location: "Main Court",
      type: "training",
      participants: 12,
    },
    {
      id: 2,
      title: "Swimming Class",
      time: "14:00 - 15:30",
      location: "Pool",
      type: "class",
      participants: 8,
    },
    {
      id: 3,
      title: "Youth Tournament",
      time: "16:00 - 18:00",
      location: "Court 2",
      type: "tournament",
      participants: 24,
    },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case "training":
        return "bg-blue-100 text-blue-800"
      case "class":
        return "bg-green-100 text-green-800"
      case "tournament":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "training":
        return "Training"
      case "class":
        return "Class"
      case "tournament":
        return "Tournament"
      default:
        return "Event"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Schedule</CardTitle>
          <CardDescription>Today's upcoming events</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/calendario')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          View calendar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex items-start space-x-3 p-3 rounded-lg border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">{event.title}</h4>
                <Badge className={getTypeColor(event.type)}>{getTypeLabel(event.type)}</Badge>
              </div>
              <div className="flex items-center text-xs text-gray-500 space-x-3">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {event.time}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {event.location}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">{event.participants} participants</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
