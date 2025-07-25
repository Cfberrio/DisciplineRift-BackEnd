"use client"
import { useState } from "react"
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Service } from "@/lib/api/types"

interface BulkStatusDialogProps {
  open: boolean
  onClose: () => void
  selectedServices: any[]
  onStatusChange: () => void
}

const statusConfig = {
  active: {
    label: "Activo",
    icon: CheckCircle,
    color: "bg-green-500",
    description: "Los servicios estarán disponibles y visibles para los usuarios.",
  },
  inactive: {
    label: "Inactivo",
    icon: Clock,
    color: "bg-yellow-500",
    description: "Los servicios estarán temporalmente deshabilitados pero no eliminados.",
  },
  ended: {
    label: "Finalizado",
    icon: XCircle,
    color: "bg-gray-500",
    description: "Los servicios se marcarán como completados y no estarán disponibles.",
  },
}

export function BulkStatusDialog({
  open,
  onClose,
  selectedServices,
  onStatusChange,
}: BulkStatusDialogProps) {
  const [newStatus, setNewStatus] = useState<"active" | "inactive" | "ended">("active")
  const [isLoading, setIsLoading] = useState(false)
  
  const config = statusConfig[newStatus] || statusConfig.active
  const Icon = config?.icon || CheckCircle

  // Analyze potential conflicts
  const conflicts = selectedServices.filter((service: any) => {
    if (newStatus === "ended" && service.status === "active") {
      // Check if service has future dates or active participants
      return true // This would be more sophisticated in a real app
    }
    return false
  })

  const hasConflicts = conflicts.length > 0

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      onStatusChange()
      onClose()
    } catch (error) {
      console.error("Error updating status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 text-white rounded-full p-1 ${config.color}`} />
            Cambiar Estado a "{config.label}"
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            Estás a punto de cambiar el estado de <strong>{selectedServices.length}</strong> servicio
            {selectedServices.length > 1 ? "s" : ""} a "{config.label}".
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>

          {hasConflicts && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Advertencias Detectadas</span>
              </div>
              <p className="text-sm text-yellow-700">
                Algunos servicios activos serán marcados como finalizados. Esto puede afectar a participantes
                registrados o fechas futuras programadas.
              </p>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Nuevo Estado:</h4>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as "active" | "inactive" | "ended")}
              className="w-full px-3 py-2 border rounded-md mb-4"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="ended">Finalizado</option>
            </select>
            
            <h4 className="font-medium mb-2">Servicios Seleccionados:</h4>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-2">
                                  {selectedServices.map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{service.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {service.status === "active"
                          ? "Activo"
                          : service.status === "inactive"
                            ? "Inactivo"
                            : "Finalizado"}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading} className={config.color}>
            {isLoading ? "Aplicando cambios..." : `Cambiar a ${config.label}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
