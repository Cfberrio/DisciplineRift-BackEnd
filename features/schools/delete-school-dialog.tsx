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
import { useSchools } from "@/contexts/schools-context"
import { useToast } from "@/hooks/use-toast"
import type { School } from "@/lib/db/school-service"

interface DeleteSchoolDialogProps {
  school: School | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteSchoolDialog({ school, open, onOpenChange }: DeleteSchoolDialogProps) {
  const { removeSchool } = useSchools()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!school) return

    setLoading(true)
    try {
      await removeSchool(school.schoolid)
      toast({
        title: "Éxito",
        description: "Escuela eliminada correctamente",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting school:", error)
      toast({
        title: "Error",
        description: "Error al eliminar la escuela",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eliminar Escuela</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar la escuela <strong>"{school?.name}"</strong>? Esta acción no se puede
            deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
