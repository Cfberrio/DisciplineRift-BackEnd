"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Section {
  id: string
  name: string
  startDate: Date
  startTime: string
  duration: string
  repeat: string
  staffId: string
  recurringDates?: Date[]
}

interface SectionDebugProps {
  sections: Section[]
  onTestSave: (section: Section) => void
}

export function SectionDebug({ sections, onTestSave }: SectionDebugProps) {
  const [isTestingPending, setIsTestingPending] = React.useState(false)

  const handleTestSave = async () => {
    setIsTestingPending(true)
    console.log("=== TESTING SECTION SAVE ===")

    try {
      const testSection: Section = {
        id: `test-${Date.now()}`,
        name: "Test Section",
        startDate: new Date(),
        startTime: "10:00 AM",
        duration: "1 hr",
        repeat: "weekly",
        staffId: "coach-santiago",
        recurringDates: [new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)],
      }

      console.log("Test section data:", testSection)

      // Simulate the save operation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      onTestSave(testSection)
      console.log("Test save completed successfully")
    } catch (error) {
      console.error("Test save failed:", error)
    } finally {
      setIsTestingPending(false)
    }
  }

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Debug: Secciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Total de secciones: {sections.length}</span>
          <Button size="sm" variant="outline" onClick={handleTestSave} disabled={isTestingPending}>
            {isTestingPending ? "Probando..." : "Probar Guardado"}
          </Button>
        </div>

        {sections.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Secciones actuales:</h4>
            {sections.map((section, index) => (
              <div key={section.id} className="text-xs p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{index + 1}</Badge>
                  <span className="font-medium">{section.name}</span>
                  <Badge variant="outline">{section.repeat}</Badge>
                </div>
                <div className="mt-1 text-muted-foreground">
                  ID: {section.id} | Fechas: {section.recurringDates?.length || 1}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>Estado del componente:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Secciones cargadas: {sections.length > 0 ? "✅" : "❌"}</li>
            <li>Función onTestSave: {typeof onTestSave === "function" ? "✅" : "❌"}</li>
            <li>Timestamp: {new Date().toLocaleTimeString()}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
