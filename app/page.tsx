"use client"

export const dynamic = "force-dynamic"

import { Sidebar } from "@/components/sidebar"
import { TodaySessionsView } from "@/components/today-sessions-view"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <TodaySessionsView />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
