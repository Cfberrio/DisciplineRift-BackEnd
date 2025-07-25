"use client"

import { useState } from "react"
import { Search, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useStaff } from "@/contexts/staff-context"
import { StaffDialog } from "./staff-dialog"
import { DeleteStaffDialog } from "./delete-staff-dialog"
import type { Staff } from "@/lib/api/staff-api"

export function StaffTable() {
  const { staff = [], loading = false, error } = useStaff() || {}
  const [searchTerm, setSearchTerm] = useState("")
  const [showStaffDialog, setShowStaffDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  // Ensure staff is always an array before filtering
  const safeStaff = Array.isArray(staff) ? staff : []

  // Filter staff based on search term
  const filteredStaff = safeStaff.filter((member) => {
    if (!member) return false
    const searchLower = searchTerm.toLowerCase()
    return (
      member.name?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.phone?.toLowerCase().includes(searchLower)
    )
  })

  const handleEdit = (member: Staff) => {
    setSelectedStaff(member)
    setShowStaffDialog(true)
  }

  const handleDelete = (member: Staff) => {
    setSelectedStaff(member)
    setShowDeleteDialog(true)
  }

  const handleCloseDialog = () => {
    setShowStaffDialog(false)
    setSelectedStaff(null)
  }

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false)
    setSelectedStaff(null)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error al cargar el staff: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reintentar
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Staff</CardTitle>
              <CardDescription>Administra los miembros del staff de tu organización</CardDescription>
            </div>
            <Button onClick={() => setShowStaffDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No se encontraron miembros del staff" : "No hay miembros del staff registrados"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email || "-"}</TableCell>
                        <TableCell>{member.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Activo</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(member)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <StaffDialog open={showStaffDialog} onClose={handleCloseDialog} initialData={selectedStaff} />

      <DeleteStaffDialog open={showDeleteDialog} onClose={handleCloseDeleteDialog} staff={selectedStaff} />
    </>
  )
}
