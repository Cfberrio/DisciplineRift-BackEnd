"use client"

export const dynamic = "force-dynamic"

import { Sidebar } from "@/components/sidebar"
import { Schedule } from "@/components/schedule"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function AgendaPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <Schedule />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
