"use client"

export const dynamic = "force-dynamic"

import { Sidebar } from "@/components/sidebar"
import { WeeklyCalendar } from "@/features/calendar/weekly-calendar"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <WeeklyCalendar />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
