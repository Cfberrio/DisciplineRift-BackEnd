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
  /* ---------------- context ---------------- */
  const { schools, isLoading, addSchool, updateSchool, removeSchool } = useSchools()

  /* ---------------- local state ---------------- */
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<any>(null)
  const [editingSchool, setEditingSchool] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  const { toast } = useToast()

  /* ---------------- helpers ---------------- */
  const openCreate = () => {
    setEditingSchool(null)
    setSelectedSchool(null)
    setFormOpen(true)
  }

  const openView = (s: any) => {
    setSelectedSchool(s)
    setEditingSchool(null)
    setFormOpen(true)
  }

  const openEdit = (s: any) => {
    setSelectedSchool(s)
    setEditingSchool(s)
    setFormOpen(true)
  }

  const openDelete = (s: any) => {
    setSelectedSchool(s)
    setDeleteOpen(true)
  }

  const handleSave = async (data: any) => {
    try {
      setBusy(true)
      if (editingSchool) {
        await updateSchool(editingSchool.schoolid, data)
        toast({ title: "Éxito", description: "Escuela actualizada." })
      } else {
        await addSchool(data)
        toast({ title: "Éxito", description: "Escuela creada." })
      }
      setFormOpen(false)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "No se pudo guardar.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedSchool) return
    try {
      setBusy(true)
      await removeSchool(selectedSchool.schoolid)
      toast({
        title: "Éxito",
        description: `La escuela "${selectedSchool.name}" fue eliminada.`,
      })
      setDeleteOpen(false)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message ?? "No se pudo eliminar.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  /* ---------------- render ---------------- */
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Lista de Escuelas</CardTitle>
              <CardDescription>Administra todas las escuelas desde aquí.</CardDescription>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Añadir Nueva Escuela
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

      {/* ----- create / edit dialog ----- */}
      <SchoolDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        school={editingSchool}
        onSave={handleSave}
        isLoading={busy}
      />

      {/* ----- delete dialog ----- */}
      {selectedSchool && (
        <DeleteSchoolDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          school={selectedSchool}
          onConfirm={confirmDelete}
          isLoading={busy}
        />
      )}

      {/* ----- read-only details dialog ----- */}
      {selectedSchool && !editingSchool && (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
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

export default function EscuelasClientPage() {
  return (
    <ProtectedRoute requireAdmin>
      <SchoolsProvider>
        <EscuelasInner />
      </SchoolsProvider>
    </ProtectedRoute>
  )
}
