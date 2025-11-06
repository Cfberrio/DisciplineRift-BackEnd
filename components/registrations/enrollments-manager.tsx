"use client"

import React, { useState } from "react"
import {
  useEnrollments,
  useUnenrollStudent,
  type Enrollment,
} from "@/hooks/use-enrollments"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Mail, Phone, User, Search } from "lucide-react"
import { AddStudentDialog } from "./add-student-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebouncedCallback } from "@/hooks/use-debounce"

interface EnrollmentsManagerProps {
  teamId: string | null
  teamName?: string
  schoolId?: number
  maxParticipants?: number
}

function calculateAge(dob: string | null) {
  if (!dob) return null
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export function EnrollmentsManager({
  teamId,
  teamName,
  schoolId,
  maxParticipants,
}: EnrollmentsManagerProps) {
  const { data: enrollments, isLoading, error, isError } = useEnrollments(teamId)
  const unenrollStudent = useUnenrollStudent()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEnrollments, setFilteredEnrollments] = useState<Enrollment[]>([])
  const [deletingEnrollment, setDeletingEnrollment] = useState<{
    id: string
    teamid: string
    studentName: string
  } | null>(null)

  // Log enrollments for debugging
  React.useEffect(() => {
    console.log("[EnrollmentsManager] Team ID:", teamId)
    console.log("[EnrollmentsManager] Enrollments data:", enrollments)
    console.log("[EnrollmentsManager] Is loading:", isLoading)
    console.log("[EnrollmentsManager] Is error:", isError)
    if (isError) {
      console.error("[EnrollmentsManager] Error:", error)
    }
  }, [teamId, enrollments, isLoading, isError, error])

  // Debounced search
  const debouncedSearch = useDebouncedCallback((query: string) => {
    if (!enrollments) return

    if (!query) {
      setFilteredEnrollments(enrollments)
      return
    }

    const filtered = enrollments.filter((enrollment) => {
      const student = enrollment.student
      if (!student) return false

      const fullName =
        `${student.firstname} ${student.lastname}`.toLowerCase()
      const parentName = student.parent
        ? `${student.parent.firstname} ${student.parent.lastname}`.toLowerCase()
        : ""

      return (
        fullName.includes(query.toLowerCase()) ||
        parentName.includes(query.toLowerCase()) ||
        student.grade.toLowerCase().includes(query.toLowerCase())
      )
    })

    setFilteredEnrollments(filtered)
  }, 300)

  // Update filtered enrollments when enrollments change
  React.useEffect(() => {
    if (enrollments) {
      setFilteredEnrollments(enrollments)
    }
  }, [enrollments])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const handleDelete = async () => {
    if (!deletingEnrollment) return
    await unenrollStudent.mutateAsync(deletingEnrollment)
    setDeletingEnrollment(null)
  }

  if (!teamId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Select a team to manage enrollments
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentCount = enrollments?.length || 0
  const isAtCapacity = maxParticipants ? currentCount >= maxParticipants : false

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enrollments</CardTitle>
              <CardDescription>
                {teamName
                  ? `Manage student enrollments for ${teamName}`
                  : "Add or remove students from the team"}
                <div className="mt-2">
                  <Badge variant={isAtCapacity ? "destructive" : "default"}>
                    {currentCount} / {maxParticipants || "∞"} enrolled
                  </Badge>
                </div>
              </CardDescription>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              size="sm"
              disabled={isAtCapacity}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error State */}
          {isError && (
            <div className="mb-4 p-4 border border-destructive rounded-lg bg-destructive/10">
              <div className="text-sm text-destructive">
                Error loading enrollments: {error instanceof Error ? error.message : "Unknown error"}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students or parents..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !filteredEnrollments || filteredEnrollments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">
                {searchQuery ? "No students found" : "No students enrolled"}
              </p>
              <p className="text-sm">
                {searchQuery
                  ? "Try a different search term"
                  : "Add your first student to get started"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEnrollments.map((enrollment) => {
                    const student = enrollment.student
                    if (!student) return null

                    const parent = student.parent
                    const age = calculateAge(student.dob)

                    return (
                      <TableRow key={enrollment.enrollmentid}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {student.firstname} {student.lastname}
                            </div>
                            {student.ecname && (
                              <div className="text-xs text-muted-foreground">
                                EC: {student.ecname}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.grade}</Badge>
                        </TableCell>
                        <TableCell>
                          {age ? `${age} years` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {parent ? (
                            <div>
                              <div className="font-medium">
                                {parent.firstname} {parent.lastname}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {parent && (
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        window.open(`mailto:${parent.email}`)
                                      }
                                    >
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{parent.email}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() =>
                                        window.open(`tel:${parent.phone}`)
                                      }
                                    >
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{parent.phone}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDeletingEnrollment({
                                id: enrollment.enrollmentid,
                                teamid: enrollment.teamid,
                                studentName: `${student.firstname} ${student.lastname}`,
                              })
                            }
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddStudentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        teamId={teamId}
        schoolId={schoolId || null}
      />

      <AlertDialog
        open={!!deletingEnrollment}
        onOpenChange={() => setDeletingEnrollment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unenroll Student?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unenroll{" "}
              <strong>{deletingEnrollment?.studentName}</strong> from this
              team? This action can be undone by re-enrolling the student.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unenroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


