"use client"

import { useState } from "react"
import CalendarWeek from "@/components/calendar/CalendarWeek"
import { EventDrawer } from "@/components/calendar/EventDrawer"

interface WeeklyCalendarProps {
  events?: any[] // Mantener compatibilidad con props anteriores
}

export function WeeklyCalendar({ events = [] }: WeeklyCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<{
    sessionid: string
    teamid: string
    start: Date
    end: Date
    teamName: string
    occurrence: string
  } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [calendarKey, setCalendarKey] = useState(0)

  const handleEventClick = (eventInfo: {
    sessionid: string
    teamid: string
    start: Date
    end: Date
    teamName: string
    occurrence: string
  }) => {
    setSelectedEvent(eventInfo)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedEvent(null)
  }

  const handleEventUpdated = () => {
    // Forzar re-render del calendario incrementando la key
    setCalendarKey(prev => prev + 1)
  }

  return (
    <>
      <CalendarWeek
        key={calendarKey}
        onEventClick={handleEventClick}
        className="w-full"
      />
      
      <EventDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        eventInfo={selectedEvent}
        onEventUpdated={handleEventUpdated}
      />
    </>
  )
}
