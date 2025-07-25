"use client"

export const dynamic = "force-dynamic"

import { Sidebar } from "@/components/sidebar"
import { AnalyticsSection } from "@/components/analytics-section"
import { ActivityFeed } from "@/components/activity-feed"
import { Schedule } from "@/components/schedule"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
              {/* Analytics Section - Takes 3 columns on XL screens */}
              <div className="xl:col-span-3">
                <AnalyticsSection />
              </div>

              {/* Right Column - Schedule and Activity Feed */}
              <div className="xl:col-span-1 space-y-6">
                <Schedule />
                <ActivityFeed />
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
