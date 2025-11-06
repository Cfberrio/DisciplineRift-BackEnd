"use client"

import { useTeamStats } from "@/hooks/use-teams"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, School, Activity, UserCheck } from "lucide-react"

export function TeamsStats() {
  const { data: stats, isLoading } = useTeamStats()

  if (isLoading) return null

  const statsConfig = [
    {
      title: "Total Teams",
      value: stats?.totalTeams || 0,
      description: "All teams in the system",
      icon: School,
      color: "text-blue-600",
    },
    {
      title: "Active Teams",
      value: stats?.activeTeams || 0,
      description: "Teams currently accepting registrations",
      icon: Activity,
      color: "text-green-600",
    },
    {
      title: "Ongoing Teams",
      value: stats?.ongoingTeams || 0,
      description: "Teams currently in session",
      icon: UserCheck,
      color: "text-orange-600",
    },
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      description: "Enrolled across all teams",
      icon: Users,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {statsConfig.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}


