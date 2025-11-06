"use client"

export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { TeamsTable } from "@/components/registrations/teams-table"
import { TeamsStats } from "@/components/registrations/teams-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardList } from "lucide-react"

function RegistrationsPageContent() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <ClipboardList className="h-8 w-8" />
                  Registrations
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage teams, sessions, and student enrollments
                </p>
              </div>
            </div>

            {/* Statistics Cards */}
            <Suspense fallback={<StatsLoader />}>
              <TeamsStats />
            </Suspense>

            {/* Teams Table */}
            <Card>
              <CardHeader>
                <CardTitle>Teams Management</CardTitle>
                <CardDescription>
                  View, create, and manage all teams across schools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<TableLoader />}>
                  <TeamsTable />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function RegistrationsPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <RegistrationsPageContent />
    </ProtectedRoute>
  )
}

function StatsLoader() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableLoader() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  )
}


