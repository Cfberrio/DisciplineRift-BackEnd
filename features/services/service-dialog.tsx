"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ServiceForm } from "./service-form"
import { useServices } from "@/contexts/services-context"
import { useToast } from "@/hooks/use-toast"

interface ServiceDialogProps {
  open: boolean
  onClose: () => void
  service?: any
}

export function ServiceDialog({ open, onClose, service }: ServiceDialogProps) {
  const { createService, updateService } = useServices()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: any) => {
    console.log("[ServiceDialog] Form submitted with data:", JSON.stringify(data, null, 2))

    setIsLoading(true)
    try {
      if (service) {
        console.log("[ServiceDialog] Updating existing service:", service.id)
        await updateService(service.id, data)
        toast({
          title: "Servicio actualizado",
          description: "El servicio ha sido actualizado correctamente",
        })
      } else {
        console.log("[ServiceDialog] Creating new service")
        console.log("[ServiceDialog] Data being sent to createService:", JSON.stringify(data, null, 2))
        await createService(data)
        toast({
          title: "Servicio creado",
          description: "El servicio ha sido creado correctamente",
        })
      }
      onClose()
    } catch (error) {
      console.error("[ServiceDialog] Error submitting service:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar el servicio",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    console.log("[ServiceDialog] Form cancelled")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? "Editar Servicio" : "Nuevo Servicio"}</DialogTitle>
        </DialogHeader>
        <ServiceForm initialData={service} onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
      </DialogContent>
    </Dialog>
  )
}
