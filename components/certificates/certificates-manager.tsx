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
import { Loader2, Award, CheckCircle, AlertCircle, Users, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { jsPDF } from "jspdf"
import JSZip from "jszip"

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

  const createPersonalizedFrontImage = async (imagePath: string, studentName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Create canvas with image dimensions
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Draw the original image
        ctx.drawImage(img, 0, 0)

        // Configure text style - Montserrat Bold 59.33px, color #404040
        const fontSize = 59.33
        ctx.font = `bold ${fontSize}px Montserrat, Arial, sans-serif`
        ctx.fillStyle = '#404040'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'

        // Position text centered, above "ON MASTERING"
        const textX = img.width / 2 // Center horizontally
        const textY = img.height * 0.35 // Position at 31.5% from top (much lower)

        // Draw student name in uppercase
        ctx.fillText(studentName.toUpperCase(), textX, textY)

        // Convert canvas to base64
        resolve(canvas.toDataURL('image/png'))
      }

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${imagePath}`))
      }

      img.src = imagePath
    })
  }

  const generatePDFForStudent = async (student: Student, sport: string): Promise<{ filename: string; blob: Blob }> => {
    const level = student.Level
    
    if (!level || level < 1 || level > 6) {
      throw new Error(`Invalid level ${level} for student ${student.firstname} ${student.lastname}`)
    }

    // Paths for images
    const frontImagePath = `/certificates/${sport.toLowerCase()}/Front${level}.png`
    const backImagePath = `/certificates/${sport.toLowerCase()}/Back${level}.png`

    // Student full name
    const studentFullName = `${student.firstname} ${student.lastname}`

    // Create personalized front image
    const personalizedFrontBase64 = await createPersonalizedFrontImage(frontImagePath, studentFullName)

    // Load Back image
    const backImg = await fetch(backImagePath)
    const backBlob = await backImg.blob()
    const backBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(backBlob)
    })

    // Create PDF with landscape orientation
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [792, 612], // Letter size in landscape
    })

    // Add personalized Front page
    pdf.addImage(personalizedFrontBase64, 'PNG', 0, 0, 792, 612)

    // Add Back page
    pdf.addPage()
    pdf.addImage(backBase64, 'PNG', 0, 0, 792, 612)

    // Generate filename and blob
    const filename = `${student.firstname}_${student.lastname}.pdf`
    const pdfBlob = pdf.output('blob')

    return { filename, blob: pdfBlob }
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

    if (!selectedSport) {
      toast({
        title: "No sport selected",
        description: "Please select a sport first",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      console.log("[CertificatesManager] Generating certificates for selected students")
      
      const zip = new JSZip()
      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Filter selected students
      const studentsToGenerate = students.filter(student => selectedStudents.has(student.studentid))

      // Generate PDF for each selected student
      for (const student of studentsToGenerate) {
        try {
          const { filename, blob } = await generatePDFForStudent(student, selectedSport)
          zip.file(filename, blob)
          successCount++
          console.log(`[CertificatesManager] Generated certificate for ${student.firstname} ${student.lastname}`)
        } catch (error) {
          errorCount++
          const errorMsg = `${student.firstname} ${student.lastname}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          console.error(`[CertificatesManager] Error generating certificate:`, errorMsg)
        }
      }

      if (successCount === 0) {
        throw new Error("Failed to generate any certificates. " + errors.join(", "))
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Download ZIP
      const zipFilename = `Certificates_${selectedSport}_FALL2025.zip`
      const url = window.URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = zipFilename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Certificates generated",
        description: `Successfully generated ${successCount} certificate${successCount !== 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} failed.` : ''}`,
      })

      if (errors.length > 0) {
        console.warn("[CertificatesManager] Errors during generation:", errors)
      }
      
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

          {/* Download Selected Certificates Button */}
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
                  <Download className="h-4 w-4" />
                  Download {selectedStudents.size > 0 ? `${selectedStudents.size} ` : ""}Certificate{selectedStudents.size !== 1 ? "s" : ""}
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

