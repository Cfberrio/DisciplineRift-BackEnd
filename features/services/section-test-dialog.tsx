"use client"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Section {
  id: string
  name: string
  startDate: Date
  startTime: string
  duration: string
  repeat: string
  staffId: string
  maxParticipants: number
}

interface SectionTestDialogProps {
  open: boolean
  onClose: () => void
  sections: Section[]
}

export function SectionTestDialog({ open, onClose, sections }: SectionTestDialogProps) {
  const { toast } = useToast()

  const testSectionSave = () => {
    console.log("Testing section save functionality...")
    console.log("Current sections:", sections)

    if (sections.length === 0) {
      toast({
        title: "Prueba de Secciones",
        description: "No hay secciones para probar. Añade una sección primero.",
        variant: "destructive",
      })
      return
    }

    // Test data persistence
    const testData = {
      serviceName: "Test Service",
      sections: sections,
      timestamp: new Date().toISOString(),
    }

    // Simulate saving to localStorage for testing
    try {
      localStorage.setItem("test-service-data", JSON.stringify(testData))

      // Verify data was saved
      const savedData = localStorage.getItem("test-service-data")
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        console.log("Test data saved and retrieved:", parsedData)

        toast({
          title: "Prueba Exitosa",
          description: `Se guardaron ${sections.length} secciones correctamente`,
        })
      }
    } catch (error) {
      console.error("Error in test:", error)
      toast({
        title: "Error en Prueba",
        description: "Hubo un problema al probar el guardado",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Prueba de Guardado de Secciones</DialogTitle>
          <DialogDescription>
            Esta herramienta de diagnóstico verifica que las secciones se guarden correctamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">Estado Actual:</h4>
            <p className="text-sm text-muted-foreground">Secciones configuradas: {sections.length}</p>

            {sections.length > 0 && (
              <div className="space-y-1">
                {sections.map((section, index) => (
                  <div key={section.id} className="text-xs p-2 bg-muted rounded">
                    <strong>Sección {index + 1}:</strong> {section.name} - {section.startTime} ({section.duration})
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={testSectionSave} className="w-full">
            Probar Guardado
          </Button>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
