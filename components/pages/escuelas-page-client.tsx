"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { SchoolsProvider, useSchools } from "@/contexts/schools-context"
import { SchoolsTable } from "@/features/schools/schools-table"
import { SchoolDialog } from "@/features/schools/school-dialog"
import { DeleteSchoolDialog } from "@/features/schools/delete-school-dialog"

function EscuelasInner() {
  /* ---------- context ---------- */
  const { schools, isLoading, addSchool, updateSchool, removeSchool } = useSchools()

  /* ---------- local state ---------- */
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<any>(null)
  const [editingSchool, setEditingSchool] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()

  /* ---------- helpers ---------- */
  const openCreate = () => {
    setEditingSchool(null)
    setSelectedSchool(null)
    setDialogOpen(true)
  }

  const openView = (school: any) => {
    setSelectedSchool(school)
    setEditingSchool(null)
    setDialogOpen(true)
  }

  const openEdit = (school: any) => {
    setSelectedSchool(school)
    setEditingSchool(school)
    setDialogOpen(true)
  }

  const openDelete = (school: any) => {
    setSelectedSchool(school)
    setDeleteOpen(true)
  }

  const handleSave = async (data: any) => {
    try {
      setSaving(true)
      if (editingSchool) {
        await updateSchool(editingSchool.schoolid, data)
        toast({ title: "Éxito", description: "Escuela actualizada correctamente" })
      } else {
        await addSchool(data)
        toast({ title: "Éxito", description: "Escuela creada correctamente" })
      }
      setDialogOpen(false)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "No se pudo guardar la escuela",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedSchool) return
    try {
      setSaving(true)
      await removeSchool(selectedSchool.schoolid)
      toast({
        title: "Éxito",
        description: `La escuela "${selectedSchool.name}" fue eliminada.`,
      })
      setDeleteOpen(false)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "No se pudo eliminar la escuela",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  /* ---------- render ---------- */
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Schools List</CardTitle>
              <CardDescription>Manage all schools from here.</CardDescription>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add New School
            </Button>
          </CardHeader>
          <CardContent>
            <SchoolsTable
              schools={schools}
              isLoading={isLoading}
              onViewSchool={(id) => openView(schools.find((s) => s.schoolid === id))}
              onEditSchool={(id) => openEdit(schools.find((s) => s.schoolid === id))}
              onDeleteSchool={(id) => openDelete(schools.find((s) => s.schoolid === id))}
            />
          </CardContent>
        </Card>
      </main>

      {/* create / edit */}
      <SchoolDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        school={editingSchool}
        onSave={handleSave}
        isLoading={saving}
      />

      {/* delete */}
      {selectedSchool && (
        <DeleteSchoolDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          school={selectedSchool}
          onConfirm={confirmDelete}
          isLoading={saving}
        />
      )}

      {/* read-only details */}
      {selectedSchool && !editingSchool && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalles de la Escuela</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-semibold">#{selectedSchool.schoolid}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nombre</p>
                <p className="font-semibold">{selectedSchool.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ubicación</p>
                <p>{selectedSchool.location}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

/** Client wrapper that adds auth + provider */
export default function EscuelasPageClient() {
  return (
    <ProtectedRoute requireAdmin>
      <SchoolsProvider>
        <EscuelasInner />
      </SchoolsProvider>
    </ProtectedRoute>
  )
}
