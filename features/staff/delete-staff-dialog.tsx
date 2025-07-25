"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useStaff } from "@/contexts/staff-context"
import { useToast } from "@/hooks/use-toast"

interface DeleteStaffDialogProps {
  open: boolean
  onClose: () => void
  staff: {
    id: string
    name: string
  } | null
}

export function DeleteStaffDialog({ open, onClose, staff }: DeleteStaffDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteStaff } = useStaff()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!staff) return

    setIsDeleting(true)
    try {
      await deleteStaff(staff.id)
      toast({
        title: "Staff eliminado",
        description: `${staff.name} ha sido eliminado exitosamente.`,
      })
      onClose()
    } catch (error) {
      console.error("Error deleting staff:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el staff. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Staff</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar a <strong>{staff?.name}</strong>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
