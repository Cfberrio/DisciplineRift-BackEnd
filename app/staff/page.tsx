"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { StaffTable } from "@/features/staff/staff-table"
import { StaffProvider, useStaff } from "@/contexts/staff-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useToast } from "@/hooks/use-toast"

function StaffContent() {
  const [mounted, setMounted] = useState(false)
  const staffContext = useStaff()
  const staff = staffContext?.staff || []
  const isLoading = staffContext?.isLoading || false
  const addStaff = staffContext?.addStaff
  const updateStaff = staffContext?.updateStaff
  const removeStaff = staffContext?.removeStaff

  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleViewStaff = (id: number) => {
    const staffMember = staff.find((s) => s.staffid === id)
    if (staffMember) {
      setSelectedStaff(staffMember)
      setEditingStaff(null)
      setIsDialogOpen(true)
    }
  }

  const handleEditStaff = (id: number) => {
    const staffMember = staff.find((s) => s.staffid === id)
    if (staffMember) {
      setSelectedStaff(staffMember)
      setEditingStaff(staffMember)
      setIsDialogOpen(true)
    }
  }

  const handleDeleteStaff = (id: number) => {
    const staffMember = staff.find((s) => s.staffid === id)
    if (staffMember) {
      setSelectedStaff(staffMember)
      setIsDeleteDialogOpen(true)
    }
  }

  const handleCreateStaff = () => {
    setSelectedStaff(null)
    setEditingStaff(null)
    setIsDialogOpen(true)
  }

  const handleSaveStaff = async (staffData: any) => {
    try {
      setActionLoading(true)

      if (editingStaff && updateStaff) {
        await updateStaff(editingStaff.staffid, staffData)
        toast({
          title: "Éxito",
          description: "Personal actualizado correctamente",
        })
      } else if (addStaff) {
        await addStaff(staffData)
        toast({
          title: "Éxito",
          description: "Personal creado correctamente",
        })
      }

      setIsDialogOpen(false)
      setSelectedStaff(null)
      setEditingStaff(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el personal",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (selectedStaff && removeStaff) {
      try {
        setActionLoading(true)
        await removeStaff(selectedStaff.staffid)
        setIsDeleteDialogOpen(false)
        setSelectedStaff(null)

        toast({
          title: "Éxito",
          description: `El personal "${selectedStaff.name}" ha sido eliminado correctamente.`,
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar el personal.",
          variant: "destructive",
        })
      } finally {
        setActionLoading(false)
      }
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <StaffTable
      staff={staff}
      isLoading={isLoading}
      onViewStaff={handleViewStaff}
      onEditStaff={handleEditStaff}
      onDeleteStaff={handleDeleteStaff}
    />
  )
}

export default function StaffPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="container mx-auto px-6 py-8">
              <StaffProvider>
                <StaffContent />
              </StaffProvider>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
