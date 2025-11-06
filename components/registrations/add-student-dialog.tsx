"use client"

import { useState } from "react"
import {
  useAvailableStudents,
  useEnrollStudent,
  type AvailableStudent,
} from "@/hooks/use-enrollments"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, User, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebouncedCallback } from "@/hooks/use-debounce"

interface AddStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string | null
  schoolId: number | null
}

export function AddStudentDialog({
  open,
  onOpenChange,
  teamId,
  schoolId,
}: AddStudentDialogProps) {
  const { data: availableStudents, isLoading } = useAvailableStudents(
    teamId,
    schoolId
  )
  const enrollStudent = useEnrollStudent()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredStudents, setFilteredStudents] = useState<AvailableStudent[]>(
    []
  )
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  // Debounced search
  const debouncedSearch = useDebouncedCallback((query: string) => {
    if (!availableStudents) return

    if (!query) {
      setFilteredStudents(availableStudents)
      return
    }

    const filtered = availableStudents.filter((student) => {
      const fullName = `${student.firstname} ${student.lastname}`.toLowerCase()
      const parentName = student.parent
        ? `${student.parent.firstname} ${student.parent.lastname}`.toLowerCase()
        : ""

      return (
        fullName.includes(query.toLowerCase()) ||
        parentName.includes(query.toLowerCase()) ||
        student.grade.toLowerCase().includes(query.toLowerCase())
      )
    })

    setFilteredStudents(filtered)
  }, 300)

  // Update filtered students when available students change
  useState(() => {
    if (availableStudents) {
      setFilteredStudents(availableStudents)
      debouncedSearch(searchQuery)
    }
  })

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    debouncedSearch(value)
  }

  const handleEnroll = async () => {
    if (!selectedStudent || !teamId) return

    try {
      await enrollStudent.mutateAsync({
        teamid: teamId,
        studentid: selectedStudent,
      })
      onOpenChange(false)
      setSelectedStudent(null)
      setSearchQuery("")
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) {
          setSelectedStudent(null)
          setSearchQuery("")
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription>
            Search and select a student to enroll in this team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student or parent name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Students List */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : !filteredStudents || filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">
                  {searchQuery ? "No students found" : "No available students"}
                </p>
                <p className="text-sm">
                  {searchQuery
                    ? "Try a different search term"
                    : "All students are already enrolled"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map((student) => {
                  const isSelected = selectedStudent === student.studentid

                  return (
                    <button
                      key={student.studentid}
                      onClick={() => setSelectedStudent(student.studentid)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {student.firstname} {student.lastname}
                            </span>
                            <Badge variant="outline">{student.grade}</Badge>
                          </div>

                          {student.parent && (
                            <div className="text-sm text-muted-foreground">
                              Parent: {student.parent.firstname}{" "}
                              {student.parent.lastname}
                            </div>
                          )}

                          {student.parent && (
                            <div className="text-xs text-muted-foreground">
                              {student.parent.email} • {student.parent.phone}
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={enrollStudent.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={!selectedStudent || enrollStudent.isPending}
          >
            {enrollStudent.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Enroll Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


