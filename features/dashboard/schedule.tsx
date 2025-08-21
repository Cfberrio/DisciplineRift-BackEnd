"use client"

import { Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useSchedule } from "@/lib/hooks/use-schedule"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"

export function Schedule() {
  const { data, isLoading, error, refetch } = useSchedule()
  const router = useRouter()

  // Default events to show while loading
  const defaultEvents = [
    {
      id: "1",
      title: "VOLLEYBALL PINECREST",
      date: "2025-04-29",
      time: "3:00 PM",
      participants: 19,
      maxParticipants: 20,
    },
    {
      id: "2",
      title: "ADVANCED TENNIS PINECREST",
      date: "2025-04-29",
      time: "3:15 PM",
      participants: 5,
      maxParticipants: 20,
    },
    {
      id: "3",
      title: "VOLLEYBALL INDEPENDENCE",
      date: "2025-04-29",
      time: "3:15 PM",
      participants: 21,
      maxParticipants: 20,
    },
  ]

  const events = data?.events || defaultEvents
  const currentDate = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long" })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>Upcoming sessions and events</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push('/calendario')}>
          View calendar
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="grid gap-1 w-full">
                      <Skeleton className="h-5 w-40" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    </div>
                  </div>
                  {i < 3 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-medium">Today, {currentDate}</div>
            <div className="grid gap-4">
              {events.map((event, index) => (
                <div key={event.id}>
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-blue-100 p-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="grid gap-1">
                      <div className="font-semibold">{event.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {event.time}
                        <Badge variant="outline" className="ml-1">
                          {event.participants}/{event.maxParticipants} participants
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {index < events.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">Error loading data: {error.message}</div>
        )}
      </CardContent>
    </Card>
  )
}
