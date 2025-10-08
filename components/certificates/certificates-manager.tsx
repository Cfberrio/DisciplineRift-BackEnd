"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Award, CheckCircle, AlertCircle, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  studentid: string
  firstname: string
  lastname: string
  grade: string | null
  Level: string | null
}

const SPORTS = [
  { value: "Volleyball", label: "Volleyball" },
  { value: "Tennis", label: "Tennis" },
  { value: "Pickleball", label: "Pickleball" },
]

export function CertificatesManager() {
  const [selectedSport, setSelectedSport] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch students when sport is selected
  useEffect(() => {
    if (selectedSport) {
      fetchStudents()
    } else {
      setStudents([])
      setSelectedStudents(new Set())
    }
  }, [selectedSport])

  const fetchStudents = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log("[CertificatesManager] Fetching students for sport:", selectedSport)
      
      const response = await fetch(`/api/certificates/students?sport=${encodeURIComponent(selectedSport)}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch students")
      }

      const data = await response.json()
      console.log("[CertificatesManager] Fetched students:", data)
      
      setStudents(data.students || [])
      setSelectedStudents(new Set())

      if (data.students.length === 0) {
        toast({
          title: "No students found",
          description: `No eligible students found for ${selectedSport}`,
          variant: "default",
        })
      }
    } catch (err) {
      console.error("[CertificatesManager] Error fetching students:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map((s) => s.studentid)))
    }
  }

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleGenerateCertificates = async () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "No students selected",
        description: "Please select at least one student to generate certificates",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      console.log("[CertificatesManager] Generating certificates for:", Array.from(selectedStudents))
      
      // TODO: Implement certificate generation API
      // This will be implemented when the template is provided
      
      toast({
        title: "Certificates ready",
        description: `Ready to generate ${selectedStudents.size} certificate${selectedStudents.size !== 1 ? 's' : ''}. Template will be applied next.`,
      })
      
    } catch (err) {
      console.error("[CertificatesManager] Error generating certificates:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate certificates",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sport Selection */}
      <div className="space-y-2">
        <Label htmlFor="sport-select">Select Sport</Label>
        <Select value={selectedSport} onValueChange={setSelectedSport}>
          <SelectTrigger id="sport-select" className="w-full max-w-xs">
            <SelectValue placeholder="Choose a sport..." />
          </SelectTrigger>
          <SelectContent>
            {SPORTS.map((sport) => (
              <SelectItem key={sport.value} value={sport.value}>
                {sport.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading students...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Students List */}
      {!isLoading && !error && selectedSport && students.length > 0 && (
        <div className="space-y-4">
          {/* Header with Select All */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all"
                checked={selectedStudents.size === students.length}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="cursor-pointer font-medium">
                Select All ({students.length} student{students.length !== 1 ? 's' : ''})
              </Label>
            </div>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {selectedStudents.size} selected
            </Badge>
          </div>

          {/* Students Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="w-12 px-4 py-3 text-left">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">First Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Last Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Grade</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.map((student) => (
                    <tr
                      key={student.studentid}
                      className={`hover:bg-muted/50 transition-colors ${
                        selectedStudents.has(student.studentid) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedStudents.has(student.studentid)}
                          onCheckedChange={() => handleSelectStudent(student.studentid)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">{student.firstname}</td>
                      <td className="px-4 py-3 text-sm">{student.lastname}</td>
                      <td className="px-4 py-3 text-sm">
                        {student.grade ? (
                          <Badge variant="outline">{student.grade}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {student.Level ? (
                          <Badge variant="secondary">{student.Level}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generate Certificates Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleGenerateCertificates}
              disabled={selectedStudents.size === 0 || isGenerating}
              size="lg"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4" />
                  Generate {selectedStudents.size > 0 ? `${selectedStudents.size} ` : ""}Certificate
                  {selectedStudents.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* No Students State */}
      {!isLoading && !error && selectedSport && students.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Eligible Students</h3>
          <p className="text-sm text-muted-foreground">
            No students found for {selectedSport} with active enrollment in completed teams.
          </p>
        </div>
      )}
    </div>
  )
}

