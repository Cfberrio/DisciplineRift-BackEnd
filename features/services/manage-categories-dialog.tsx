"use client"

import { useState, useEffect } from "react"
import { Edit, Pencil, Plus, Search, Trash, CheckCircle, Clock, XCircle } from "lucide-react"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "./status-badge"
import { DeleteServiceDialog } from "./delete-service-dialog"
import { BulkStatusDialog } from "./bulk-status-dialog"
import { useToast } from "@/hooks/use-toast"
import type { Service } from "@/lib/api/types"

interface ManageCategoriesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  services: Service[]
  onEditService: (id: number) => void
  onDeleteService: (id: number) => Promise<void>
  onBulkUpdateStatus: (serviceIds: number[], status: "active" | "inactive" | "ended") => Promise<void>
  onRefresh: () => Promise<void>
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  services,
  onEditService,
  onDeleteService,
  onBulkUpdateStatus,
  onRefresh,
}: ManageCategoriesDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("services")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [pendingBulkStatus, setPendingBulkStatus] = useState<"active" | "inactive" | "ended" | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [categories, setCategories] = useState<string[]>([])

  // Extract unique categories from services
  useEffect(() => {
    if (services.length > 0) {
      const uniqueCategories = Array.from(
        new Set(services.map((service) => service.serviceType).filter(Boolean)),
      ) as string[]
      setCategories(uniqueCategories)
    }
  }, [services])

  // Filter services based on search query
  const filteredServices = services.filter((service) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      service.name.toLowerCase().includes(query) ||
      service.serviceType?.toLowerCase().includes(query) ||
      service.location?.toLowerCase().includes(query)
    )
  })

  // Get selected services objects
  const selectedServiceObjects = services.filter((service) => selectedServices.includes(service.id))

  // Handle service selection
  const toggleServiceSelection = (id: number) => {
    setSelectedServices((prev) => {
      if (prev.includes(id)) {
        return prev.filter((serviceId) => serviceId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  // Handle select all services
  const toggleSelectAll = () => {
    if (selectedServices.length === filteredServices.length) {
      setSelectedServices([])
    } else {
      setSelectedServices(filteredServices.map((service) => service.id))
    }
  }

  // Handle single service deletion
  const handleDeleteSingleService = (service: Service) => {
    setServiceToDelete(service)
    setConfirmDeleteOpen(true)
  }

  // Handle bulk service deletion
  const handleDeleteSelectedServices = () => {
    toast({
      title: "Operación no implementada",
      description: `La eliminación masiva de ${selectedServices.length} servicios no está implementada en esta demo.`,
      variant: "destructive",
    })
  }

  // Handle bulk status change
  const handleBulkStatusChange = (status: "active" | "inactive" | "ended") => {
    if (selectedServices.length === 0) {
      toast({
        title: "No hay servicios seleccionados",
        description: "Selecciona al menos un servicio para cambiar su estado.",
        variant: "destructive",
      })
      return
    }

    setPendingBulkStatus(status)
    setBulkStatusDialogOpen(true)
  }

  // Confirm bulk status change
  const confirmBulkStatusChange = async () => {
    if (!pendingBulkStatus || selectedServices.length === 0) return

    try {
      setIsBulkUpdating(true)
      await onBulkUpdateStatus(selectedServices, pendingBulkStatus)
      await onRefresh()

      const statusLabel =
        pendingBulkStatus === "active" ? "activo" : pendingBulkStatus === "inactive" ? "inactivo" : "finalizado"

      toast({
        title: "Estados actualizados",
        description: `Se ha cambiado el estado de ${selectedServices.length} servicio${selectedServices.length > 1 ? "s" : ""} a ${statusLabel}.`,
      })

      setSelectedServices([])
      setBulkStatusDialogOpen(false)
      setPendingBulkStatus(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los estados de los servicios. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsBulkUpdating(false)
    }
  }

  // Confirm deletion of a single service
  const confirmDeleteService = async () => {
    if (!serviceToDelete) return

    try {
      setIsDeleting(true)
      await onDeleteService(serviceToDelete.id)
      await onRefresh()
      toast({
        title: "Servicio eliminado",
        description: `El servicio "${serviceToDelete.name}" ha sido eliminado correctamente.`,
      })
      setSelectedServices((prev) => prev.filter((id) => id !== serviceToDelete.id))
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setConfirmDeleteOpen(false)
      setServiceToDelete(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Administrar Categorías y Servicios</DialogTitle>
            <DialogDescription>
              Gestiona las categorías de servicios y edita o elimina servicios existentes.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="services" className="flex-1 flex flex-col" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="services">Servicios</TabsTrigger>
                <TabsTrigger value="categories">Categorías</TabsTrigger>
              </TabsList>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <TabsContent value="services" className="flex-1 flex flex-col mt-0">
              {selectedServices.length > 0 && (
                <div className="bg-muted/50 p-4 rounded-md mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">{selectedServices.length}</span> servicio
                      {selectedServices.length > 1 ? "s" : ""} seleccionado{selectedServices.length > 1 ? "s" : ""}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setSelectedServices([])} className="h-8 text-xs">
                      Deseleccionar todos
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange("active")}
                      className="h-8 text-xs gap-1"
                      disabled={isBulkUpdating}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Marcar como Activo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange("inactive")}
                      className="h-8 text-xs gap-1"
                      disabled={isBulkUpdating}
                    >
                      <Clock className="h-3 w-3" />
                      Marcar como Inactivo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkStatusChange("ended")}
                      className="h-8 text-xs gap-1"
                      disabled={isBulkUpdating}
                    >
                      <XCircle className="h-3 w-3" />
                      Marcar como Finalizado
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteSelectedServices}
                      className="h-8 text-xs"
                      disabled={isBulkUpdating}
                    >
                      Eliminar seleccionados
                    </Button>
                  </div>
                </div>
              )}

              <div className="border rounded-md flex-1 overflow-hidden">
                <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
                  <div className="col-span-1 flex justify-center">
                    <Checkbox
                      checked={filteredServices.length > 0 && selectedServices.length === filteredServices.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </div>
                  <div className="col-span-5">Servicio</div>
                  <div className="col-span-2">Categoría</div>
                  <div className="col-span-2">Estado</div>
                  <div className="col-span-2 text-right">Acciones</div>
                </div>

                <ScrollArea className="h-[400px]">
                  {filteredServices.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No se encontraron servicios que coincidan con tu búsqueda.
                    </div>
                  ) : (
                    filteredServices.map((service, index) => (
                      <div
                        key={service.id}
                        className={`grid grid-cols-12 items-center p-3 hover:bg-muted/20 transition-colors ${
                          selectedServices.includes(service.id)
                            ? "bg-primary/10 border-l-4 border-primary"
                            : index % 2 === 0
                              ? "bg-white"
                              : "bg-muted/10"
                        } ${index !== filteredServices.length - 1 ? "border-b" : ""}`}
                      >
                        <div className="col-span-1 flex justify-center">
                          <Checkbox
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => toggleServiceSelection(service.id)}
                          />
                        </div>
                        <div className="col-span-5 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-muted/20 flex items-center justify-center border">
                            {service.icon ? (
                              <img
                                src={service.icon || "/placeholder.svg"}
                                alt={service.name}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                                {service.name.substring(0, 2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{service.name}</div>
                            <div className="text-sm text-muted-foreground">{service.location}</div>
                          </div>
                        </div>
                        <div className="col-span-2">
                          {service.serviceType ? (
                            <Badge variant="outline" className="font-normal">
                              {service.serviceType}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin categoría</span>
                          )}
                        </div>
                        <div className="col-span-2">
                          <StatusBadge status={service.status || "inactive"} />
                        </div>
                        <div className="col-span-2 flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditService(service.id)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSingleService(service)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="flex-1 flex flex-col mt-0">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium">Categorías de Servicios</h3>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Añadir Categoría
                </Button>
              </div>

              <div className="border rounded-md flex-1">
                {categories.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No hay categorías definidas. Añade una nueva categoría para empezar.
                  </div>
                ) : (
                  <div className="divide-y">
                    {categories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/20">
                        <div className="font-medium">{category}</div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Editar categoría</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Eliminar categoría</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for deleting a service */}
      {serviceToDelete && (
        <DeleteServiceDialog
          open={confirmDeleteOpen}
          onOpenChange={setConfirmDeleteOpen}
          serviceName={serviceToDelete.name}
          onConfirm={confirmDeleteService}
          isLoading={isDeleting}
        />
      )}

      {/* Bulk status change confirmation dialog */}
      {pendingBulkStatus && (
        <BulkStatusDialog
          open={bulkStatusDialogOpen}
          onOpenChange={setBulkStatusDialogOpen}
          services={selectedServiceObjects}
          newStatus={pendingBulkStatus}
          onConfirm={confirmBulkStatusChange}
          isLoading={isBulkUpdating}
        />
      )}
    </>
  )
}
