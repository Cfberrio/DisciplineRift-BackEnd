"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSchools } from "@/contexts/schools-context"
import { useToast } from "@/hooks/use-toast"
import type { School } from "@/lib/db/school-service"

interface SchoolDialogProps {
  school?: School | null
  open: boolean
  /** New – supports both APIs */
  onOpenChange?: (open: boolean) => void
  onClose?: () => void
}

export function SchoolDialog({ school, open, onOpenChange, onClose }: SchoolDialogProps) {
  const { createSchool, updateSchool } = useSchools()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
  })

  const isEditing = !!school

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name,
        location: school.location,
      })
    } else {
      setFormData({
        name: "",
        location: "",
      })
    }
  }, [school])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.location.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      if (isEditing && school) {
        await updateSchool(school.schoolid, formData)
        toast({
          title: "Éxito",
          description: "Escuela actualizada correctamente",
        })
      } else {
        await createSchool(formData)
        toast({
          title: "Éxito",
          description: "Escuela creada correctamente",
        })
      }
      if (onOpenChange) onOpenChange(false)
      if (onClose) onClose()
    } catch (error) {
      console.error("Error saving school:", error)
      toast({
        title: "Error",
        description: isEditing ? "Error al actualizar la escuela" : "Error al crear la escuela",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange ?? (() => {})}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Escuela" : "Nueva Escuela"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos de la escuela." : "Completa los datos para crear una nueva escuela."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la escuela"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Ubicación *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ciudad, Estado"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onOpenChange) onOpenChange(false)
                if (onClose) onClose()
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
