"use client"

import { useState } from "react"
import { useRoster } from "@/hooks/use-roster"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { FileDown, Calendar, Clock, User, School, FileText } from "lucide-react"
import { generateRosterPDF } from "@/lib/pdf/roster-pdf"
import { useToast } from "@/hooks/use-toast"

interface RosterViewProps {
  teamId: string | null
}

function formatTime(time: string) {
  try {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  } catch {
    return time
  }
}

function formatDate(date: string | null) {
  if (!date) return "N/A"
  try {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${month}/${day}/${year}`
  } catch {
    return date
  }
}

export function RosterView({ teamId }: RosterViewProps) {
  const { data: roster, isLoading, error, isError } = useRoster(teamId)
  const { toast } = useToast()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Helper function to get staff full name
  const getStaffFullName = (staff: any) => {
    if (!staff) return null
    if (staff.firstname && staff.lastname) {
      return `${staff.firstname} ${staff.lastname}`
    }
    return staff.name || null
  }

  // Log errors for debugging
  if (isError) {
    console.error("[RosterView] Error loading roster:", error)
  }

  const handleExportPDF = async () => {
    if (!roster) return

    setIsGeneratingPDF(true)
    try {
      await generateRosterPDF(roster)
      toast({
        title: "Success",
        description: "PDF generated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (!teamId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Select a team to view roster
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <div className="text-destructive mb-2">
              Failed to load roster
            </div>
            <div className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </div>
            {teamId && (
              <div className="text-xs text-muted-foreground mt-2">
                Team ID: {teamId}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!roster) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            No roster data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{roster.team.name} - Roster</CardTitle>
              <CardDescription>
                Complete roster - Exact format from Services section
              </CardDescription>
            </div>
            <Button onClick={handleExportPDF} disabled={isGeneratingPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? "Generating..." : "Download Roster PDF"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <School className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">School</div>
                  <div className="font-medium">{roster.team.school.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {roster.team.school.location}
                  </div>
                </div>
              </div>

              {roster.team.sport && (
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Sport</div>
                    <Badge variant="outline">{roster.team.sport}</Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Total Enrolled</div>
                <div className="text-2xl font-bold">
                  {roster.enrollments.length} students
                </div>
              </div>

              {roster.team.price && (
                <div>
                  <div className="text-sm text-muted-foreground">Price</div>
                  <div className="text-lg font-medium">${roster.team.price}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Card */}
      {roster.sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sessions Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roster.sessions.map((session) => (
                <div
                  key={session.sessionid}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">{session.daysofweek}</Badge>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatTime(session.starttime)} - {formatTime(session.endtime)}
                      </span>
                    </div>
                  </div>
                  {session.staff && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{getStaffFullName(session.staff)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Roster Table - EXACT REPLICA OF SERVICES */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Enrolled Students
              </CardTitle>
              <CardDescription>
                {roster.enrollments.length} students enrolled in this team
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {roster.enrollments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No students enrolled yet</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-blue-50 p-3 border-b">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Roster Preview
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        First Name
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Last Name
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Level
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Grade
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Dismissal
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Teacher
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Emergency
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Emergency #
                      </th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">
                        Medcondition
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.enrollments.map((enrollment, index) => {
                      const student = enrollment.student

                      return (
                        <tr
                          key={enrollment.enrollmentid}
                          className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                        >
                          <td className="px-3 py-2">
                            {student.firstname || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.lastname || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.level || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {student.grade || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.studentdismisall || student.StudentDismisall || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.teacher || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.ecname || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.ecphone || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.medcondition || "N/A"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


