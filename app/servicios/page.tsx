"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sidebar } from "@/components/sidebar"
import { ServicesTable } from "@/features/services/services-table"
import { ServiceDialog } from "@/features/services/service-dialog"
import { DeleteServiceDialog } from "@/features/services/delete-service-dialog"
import { ServiceDetail } from "@/features/services/service-detail"
import { useServices } from "@/contexts/services-context"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ServicesProvider } from "@/contexts/services-context"
import { ProtectedRoute } from "@/components/auth/protected-route"

function ServicesPageContent() {
  const servicesContext = useServices()

  // Safely destructure with defaults
  const services = servicesContext?.services || []
  const isLoading = servicesContext?.isLoading || false
  const error = servicesContext?.error || null
  const createService = servicesContext?.createService
  const updateService = servicesContext?.updateService
  const deleteService = servicesContext?.deleteService
  const getServiceById = servicesContext?.getServiceById
  const refetch = servicesContext?.refetch

  const { toast } = useToast()

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // Ensure services is always an array before transforming
  const safeServices = Array.isArray(services) ? services : []

  const transformedServices = safeServices.map((service) => {
    const sessionCount = Array.isArray(service.sessions) ? service.sessions.length : 0
    const locationText = service.school || "Sin escuela"

    return {
      id: service.teamid || service.id,
      name: service.name || "Sin nombre",
      serviceType: service.serviceType || service.description || "General",
      price: service.price ? `$${service.price}` : "Gratis",
      dateRange: sessionCount > 0 ? `${sessionCount} sesiones` : "Sin sesiones",
      location: locationText,
      participants: service.participants || 0,
      status: service.isactive ? ("active" as const) : ("inactive" as const),
      icon: service.icon || "/placeholder.svg?height=40&width=40",
      school: locationText,
      sessions: Array.isArray(service.sessions) ? service.sessions : [],
    }
  })

  const handleEditService = async (id: string) => {
    if (!getServiceById) return

    try {
      setActionLoading(true)
      const service = await getServiceById(id)
      if (service) {
        setSelectedService(service)
        setEditDialogOpen(true)
      } else {
        throw new Error("Servicio no encontrado")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar el servicio para editar.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!getServiceById) return

    try {
      setActionLoading(true)
      const service = await getServiceById(id)
      if (service) {
        setSelectedService(service)
        setDeleteDialogOpen(true)
      } else {
        throw new Error("Servicio no encontrado")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar el servicio para eliminar.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewService = async (id: string) => {
    if (!getServiceById) return

    try {
      setDetailLoading(true)
      setSelectedService(null)
      setDetailDialogOpen(true)

      const service = await getServiceById(id)

      if (service && (service.teamid || service.id)) {
        setSelectedService(service)
      } else {
        toast({
          title: "Error",
          description: "No se pudo cargar los detalles del servicio.",
          variant: "destructive",
        })
        setDetailDialogOpen(false)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar los detalles del servicio.",
        variant: "destructive",
      })
      setDetailDialogOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleAddService = async (data: any) => {
    if (!createService) return

    try {
      setActionLoading(true)
      await createService(data)
      setAddDialogOpen(false)
      toast({
        title: "Éxito",
        description: "Servicio creado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el servicio",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateService = async (data: any) => {
    if (!selectedService || !updateService) return

    try {
      setActionLoading(true)
      await updateService(selectedService.teamid || selectedService.id, data)
      setEditDialogOpen(false)
      setSelectedService(null)
      toast({
        title: "Éxito",
        description: "Servicio actualizado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedService || !deleteService) return

    try {
      setActionLoading(true)
      await deleteService(selectedService.teamid || selectedService.id)
      setDeleteDialogOpen(false)
      setSelectedService(null)
      toast({
        title: "Éxito",
        description: `El servicio "${selectedService.name}" ha sido eliminado correctamente.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false)
    setSelectedService(null)
    setDetailLoading(false)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setSelectedService(null)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setSelectedService(null)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <main className="p-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Lista de Servicios</CardTitle>
                  <CardDescription>Administra todos tus servicios desde aquí.</CardDescription>
                </div>
                <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Añadir un Nuevo Servicio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Cargando servicios...</span>
                  </div>
                ) : error ? (
                  <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
                    Error al cargar los servicios: {error.message}
                  </div>
                ) : transformedServices.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay servicios disponibles</p>
                    <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                      Crear primer servicio
                    </Button>
                  </div>
                ) : (
                  <ServicesTable
                    services={transformedServices}
                    isLoading={isLoading}
                    onViewService={handleViewService}
                    onEditService={handleEditService}
                    onDeleteService={handleDeleteService}
                    selectedServiceId={selectedService?.teamid || selectedService?.id}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <ServiceDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddService}
        isLoading={actionLoading}
      />

      <ServiceDialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        initialData={selectedService}
        onSubmit={handleUpdateService}
        isLoading={actionLoading}
      />

      <DeleteServiceDialog
        open={deleteDialogOpen}
        onOpenChange={handleCloseDeleteDialog}
        serviceName={selectedService?.name || ""}
        onConfirm={handleConfirmDelete}
        isLoading={actionLoading}
      />

      <Dialog open={detailDialogOpen} onOpenChange={handleCloseDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles del Servicio</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Cargando detalles del servicio...</span>
            </div>
          ) : selectedService ? (
            <ServiceDetail service={selectedService} />
          ) : (
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">Selecciona un servicio para ver sus detalles</p>
              <p className="text-sm text-gray-400">Haz clic en el botón "Ver" de cualquier servicio en la tabla</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ServiciosPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <ServicesProvider>
        <ServicesPageContent />
      </ServicesProvider>
    </ProtectedRoute>
  )
}
