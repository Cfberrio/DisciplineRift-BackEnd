"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useServices } from "@/contexts/services-context"
import { ServiceDialog } from "./service-dialog"
import { ServiceDetail } from "./service-detail"
import { ServicesFilters } from "./services-filters"
import { ManageCategoriesDialog } from "./manage-categories-dialog"
import { DeleteServiceDialog } from "./delete-service-dialog"
import { BulkStatusDialog } from "./bulk-status-dialog"

interface Service {
  id: string
  teamid: string
  name: string
  description: string
  price: number
  participants: number
  status: "active" | "inactive" | "ended"
  isactive: boolean
  schoolid: number
  school?: string
  sessions?: any[]
  enrolledStudents?: number
}

export function ServicesTable() {
  const { services = [], isLoading = false, error } = useServices() || {}
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [showServiceDetail, setShowServiceDetail] = useState(false)
  const [showManageCategories, setShowManageCategories] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkStatusDialog, setShowBulkStatusDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  // Ensure services is always an array before filtering
  const safeServices = Array.isArray(services) ? services : []

  // Advanced filtering using useMemo for performance
  const filteredServices = useMemo(() => {
    return safeServices.filter((service) => {
      if (!service) return false
      
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        service.name?.toLowerCase().includes(searchLower) ||
        service.description?.toLowerCase().includes(searchLower) ||
        service.school?.toLowerCase().includes(searchLower) ||
        service.price?.toString().includes(searchLower)

      const matchesCategory = filterCategory === "all" || 
        service.status === filterCategory

      return matchesSearch && matchesCategory
    })
  }, [safeServices, searchTerm, filterCategory])

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setShowServiceDialog(true)
  }

  const handleView = (service: Service) => {
    setSelectedService(service)
    setShowServiceDetail(true)
  }

  const handleDelete = (service: Service) => {
    setSelectedService(service)
    setShowDeleteDialog(true)
  }

  const handleFilterChange = (filters: { category: string; search: string }) => {
    setFilterCategory(filters.category)
    setSearchTerm(filters.search)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
      }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-yellow-100 text-yellow-800"
      case "ended":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Active"
      case "inactive":
        return "Inactive"
      case "ended":
        return "Ended"
      default:
        return "Unknown"
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error loading services: {error.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Services Management</CardTitle>
              <CardDescription>
                Manage all school sports services
              </CardDescription>
            </div>
            <Button onClick={() => setShowServiceDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Enhanced Search and Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, description, school..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="ended">Ended</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setShowManageCategories(true)}
                className="whitespace-nowrap"
              >
                Manage
              </Button>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredServices.length} de {safeServices.length} servicios
              {searchTerm && ` para "${searchTerm}"`}
            </p>
            {selectedServices.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedServices.length} seleccionados
                </span>
                <Button size="sm" variant="outline" onClick={() => setShowBulkStatusDialog(true)}>
                  Cambiar Estado
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? "No se encontraron servicios que coincidan con tu búsqueda" : "No hay servicios registrados"}
              </p>
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-2">
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedServices.length === filteredServices.length && filteredServices.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedServices(filteredServices.map(s => s.id))
                          } else {
                            setSelectedServices([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Escuela</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Participantes</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedServices([...selectedServices, service.id])
                            } else {
                              setSelectedServices(selectedServices.filter(id => id !== service.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {service.description}
                            </div>
                          )}
                          {service.sessions && service.sessions.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {service.sessions.length} sesión(es) programada(s)
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{service.school || "Sin escuela"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatPrice(service.price)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">Max: {service.participants}</span>
                          {service.enrolledStudents !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              Inscritos: {service.enrolledStudents}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(service.status)}>
                          {getStatusText(service.status)}
                        </Badge>
                </TableCell>
                  <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(service)}
                            className="h-8 w-8 p-0"
                          >
                        <Eye className="h-4 w-4" />
                      </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(service)}
                            className="h-8 w-8 p-0"
                          >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(service)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                  ))}
          </TableBody>
        </Table>
      </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ServiceDialog
        open={showServiceDialog}
        onClose={() => {
          setShowServiceDialog(false)
          setSelectedService(null)
        }}
        service={selectedService}
      />

      <ServiceDetail
        open={showServiceDetail}
        onClose={() => {
          setShowServiceDetail(false)
          setSelectedService(null)
        }}
        service={selectedService}
      />

      <ManageCategoriesDialog
        open={showManageCategories}
        onOpenChange={setShowManageCategories}
        services={filteredServices}
        onEditService={handleEdit}
        onDeleteService={handleDelete}
        onBulkUpdateStatus={() => setShowBulkStatusDialog(true)}
        onRefresh={() => window.location.reload()}
      />

      <DeleteServiceDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setSelectedService(null)
        }}
        service={selectedService}
      />

      <BulkStatusDialog
        open={showBulkStatusDialog}
        onClose={() => setShowBulkStatusDialog(false)}
        selectedServices={selectedServices.map(id => filteredServices.find(s => s.id === id)).filter(Boolean) as Service[]}
        onStatusChange={() => {
          setSelectedServices([])
          setShowBulkStatusDialog(false)
        }}
      />
    </>
  )
}
