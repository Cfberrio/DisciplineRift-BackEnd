"use client"

import { useState, useRef } from "react"
import CalendarWeek, { CalendarWeekHandle } from "@/components/calendar/CalendarWeek"
import { EventDrawer } from "@/components/calendar/EventDrawer"

interface WeeklyCalendarProps {
  events?: any[] // Keep compatibility with previous props
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
  const calendarRef = useRef<CalendarWeekHandle>(null)

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
    // Clear selected event after a small delay to prevent flashing
    setTimeout(() => {
      setSelectedEvent(null)
    }, 200)
  }

  const handleEventUpdated = () => {
    // Directly call refresh on calendar if available
    if (calendarRef.current) {
      calendarRef.current.refresh()
    }
  }

  return (
    <>
      <CalendarWeek
        ref={calendarRef}
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
