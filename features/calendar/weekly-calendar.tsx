"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Event {
  id: string
  title: string
  time: string
  duration: number
  color: string
}

interface WeeklyCalendarProps {
  events?: Event[]
}

export function WeeklyCalendar({ events = [] }: WeeklyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const weekDates = getWeekDates(currentDate)

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7))
    setCurrentDate(newDate)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    })
  }

  const formatWeekRange = () => {
    const start = weekDates[0]
    const end = weekDates[6]
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendario Semanal</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">{formatWeekRange()}</span>
              <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-1">
          {/* Time column header */}
          <div className="p-2"></div>
          {/* Day headers */}
          {daysOfWeek.map((day, index) => (
            <div key={day} className="p-2 text-center font-medium text-sm border-b">
              <div>{day}</div>
              <div className="text-xs text-gray-500">{weekDates[index].getDate()}</div>
            </div>
          ))}

          {/* Time slots */}
          {hours.map((hour) => (
            <>
              {/* Time label */}
              <div key={`time-${hour}`} className="p-2 text-xs text-gray-500 text-right">
                {hour}:00
              </div>
              {/* Day columns */}
              {daysOfWeek.map((day, dayIndex) => (
                <div
                  key={`${day}-${hour}`}
                  className="p-1 border border-gray-100 min-h-[60px] hover:bg-gray-50 cursor-pointer relative"
                >
                  {/* Sample events - you can replace this with actual event rendering logic */}
                  {hour === 10 && dayIndex === 1 && (
                    <div className="bg-blue-100 text-blue-800 text-xs p-1 rounded mb-1">Reunión de equipo</div>
                  )}
                  {hour === 14 && dayIndex === 3 && (
                    <div className="bg-green-100 text-green-800 text-xs p-1 rounded mb-1">Entrenamiento</div>
                  )}
                  {hour === 16 && dayIndex === 5 && (
                    <div className="bg-purple-100 text-purple-800 text-xs p-1 rounded mb-1">Partido</div>
                  )}
                </div>
              ))}
            </>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
