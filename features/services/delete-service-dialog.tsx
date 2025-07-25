"use client"

import { useState } from "react"
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
import { useServices } from "@/contexts/services-context"
import { useToast } from "@/hooks/use-toast"

interface DeleteServiceDialogProps {
  open: boolean
  onClose: () => void
  service: any
}

export function DeleteServiceDialog({
  open,
  onClose,
  service,
}: DeleteServiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { deleteService } = useServices()
  const { toast } = useToast()

  const handleConfirm = async () => {
    if (!service) return

    setIsLoading(true)
    try {
      console.log("🗑️ Starting delete process for service:", service.name, "ID:", service.id || service.teamid)

      // Get the service ID (could be 'id' or 'teamid')
      const serviceId = service.id || service.teamid

      if (!serviceId) {
        throw new Error("No se pudo encontrar el ID del servicio")
      }

      // Use the context method which handles sessions and team deletion
      console.log("🗑️ Deleting service using context method...")
      await deleteService(serviceId)
      console.log("✅ Service deleted successfully")

      // Show success message
      toast({
        title: "Servicio eliminado",
        description: `El servicio "${service.name}" ha sido eliminado correctamente.`,
        variant: "default",
      })

      console.log("✅ Delete process completed successfully")
      onClose()
    } catch (error) {
      console.error("❌ Error deleting service:", error)
      
      // Show error message
      toast({
        title: "Error al eliminar",
        description: `No se pudo eliminar el servicio: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })

      // Don't close the dialog on error, let user try again or cancel
    } finally {
      setIsLoading(false)
    }
  }

  if (!service) {
    return null
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Esta acción eliminará permanentemente el servicio{" "}
            <strong className="text-destructive font-semibold">{service.name}</strong> y no se puede deshacer.
          </AlertDialogDescription>
          {service.sessions && service.sessions.length > 0 && (
            <div className="mt-2 text-sm text-muted-foreground">
              También se eliminarán {service.sessions.length} sesión(es) programada(s).
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Eliminando...
              </span>
            ) : (
              "Eliminar"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
