"use client"

export const dynamic = "force-dynamic"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SessionsManager } from "@/components/registrations/sessions-manager"
import { EnrollmentsManager } from "@/components/registrations/enrollments-manager"
import { RosterView } from "@/components/registrations/roster-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, School, Users, DollarSign, Calendar, Activity, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

// Fetch single team by ID
async function fetchTeamById(teamId: string) {
  const { data, error } = await supabase
    .from("team")
    .select(
      `
      *,
      school:schoolid (
        schoolid,
        name,
        location
      )
    `
    )
    .eq("teamid", teamId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Get enrollment count
  const { data: enrollments } = await supabase
    .from("enrollment")
    .select("enrollmentid")
    .eq("teamid", teamId)
    .eq("isactive", true)

  return {
    ...data,
    _count: {
      enrollments: enrollments?.length || 0,
    },
  }
}

function TeamDetailPageContent({ params }: { params: Promise<{ teamid: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  
  // Fetch the specific team
  const { data: team, isLoading } = useQuery({
    queryKey: ["team", resolvedParams.teamid],
    queryFn: () => fetchTeamById(resolvedParams.teamid),
    staleTime: 30 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <main className="p-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/registrations")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
            <Card>
              <CardContent className="py-12">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <main className="p-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/registrations")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  Team not found
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push("/registrations")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Teams
      </Button>

      {/* Team Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{team.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant={team.isactive ? "default" : "secondary"}>
                    {team.isactive ? "Active" : "Inactive"}
                  </Badge>
                  {team.isongoing && (
                    <Badge variant="outline" className="bg-orange-50">
                      Ongoing
                    </Badge>
                  )}
                </div>
              </div>
              {team.sport && (
                <Badge variant="outline" className="mb-2">
                  {team.sport}
                </Badge>
              )}
              {team.description && (
                <CardDescription className="mt-2 max-w-2xl">
                  {team.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <School className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">School</div>
                <div className="font-medium">{team.school?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {team.school?.location}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Enrollment</div>
                <div className="font-medium">
                  {team._count?.enrollments || 0} / {team.participants}
                </div>
                <div className="text-xs text-muted-foreground">students</div>
              </div>
            </div>

            {team.price && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Price</div>
                  <div className="font-medium">${team.price}</div>
                  <div className="text-xs text-muted-foreground">per student</div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="font-medium">
                  {team.isactive ? "Accepting" : "Closed"}
                </div>
                <div className="text-xs text-muted-foreground">registrations</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different management sections */}
      <Tabs defaultValue="sessions" className="w-full">
        <TabsList>
          <TabsTrigger value="sessions">
            <Calendar className="h-4 w-4 mr-2" />
            Sessions
          </TabsTrigger>
          <TabsTrigger value="enrollments">
            <Users className="h-4 w-4 mr-2" />
            Enrollments
          </TabsTrigger>
          <TabsTrigger value="roster">
            <FileText className="h-4 w-4 mr-2" />
            Roster
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-6">
          <SessionsManager teamId={team.teamid} teamName={team.name} />
        </TabsContent>

        <TabsContent value="enrollments" className="mt-6">
          <EnrollmentsManager
            teamId={team.teamid}
            teamName={team.name}
            schoolId={team.schoolid}
            maxParticipants={team.participants}
          />
        </TabsContent>

        <TabsContent value="roster" className="mt-6">
          <RosterView teamId={team.teamid} />
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function TeamDetailPage({ params }: { params: Promise<{ teamid: string }> }) {
  return (
    <ProtectedRoute requireAdmin={true}>
      <TeamDetailPageContent params={params} />
    </ProtectedRoute>
  )
}

