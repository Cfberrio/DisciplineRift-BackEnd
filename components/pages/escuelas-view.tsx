"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

import { useSchools } from "@/contexts/schools-context"
import { SchoolsTable } from "@/features/schools/schools-table"
import { SchoolDialog } from "@/features/schools/school-dialog"
import { DeleteSchoolDialog } from "@/features/schools/delete-school-dialog"

export function EscuelasView() {
  const schoolsContext = useSchools()

  // Safely destructure with fallbacks to prevent undefined errors
  const schools = schoolsContext?.schools || []
  const isLoading = schoolsContext?.isLoading || false
  const addSchool = schoolsContext?.addSchool
  const updateSchool = schoolsContext?.updateSchool
  const removeSchool = schoolsContext?.removeSchool

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [busy, setBusy] = useState(false)

  const { toast } = useToast()

  const openCreate = () => {
    setSelected(null)
    setEditing(null)
    setFormOpen(true)
  }

  const findSchoolById = (id: number) => {
    return schools.find((s) => s.schoolid === id)
  }

  const openView = (id: number) => {
    const school = findSchoolById(id)
    if (school) {
      setSelected(school)
      setEditing(null)
      setFormOpen(true)
    }
  }

  const openEdit = (id: number) => {
    const school = findSchoolById(id)
    if (school) {
      setSelected(school)
      setEditing(school)
      setFormOpen(true)
    }
  }

  const openDelete = (id: number) => {
    const school = findSchoolById(id)
    if (school) {
      setSelected(school)
      setDeleteOpen(true)
    }
  }

  const handleSave = async (data: any) => {
    if (!addSchool || !updateSchool) return

    try {
      setBusy(true)
      if (editing) {
        await updateSchool(editing.schoolid, data)
        toast({ title: "Success", description: "School updated successfully" })
      } else {
        await addSchool(data)
        toast({ title: "Success", description: "School created successfully" })
      }
      setFormOpen(false)
      setSelected(null)
      setEditing(null)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "No se pudo guardar la escuela",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    if (!selected || !removeSchool) return

    try {
      setBusy(true)
      await removeSchool(selected.schoolid)
      toast({
        title: "Éxito",
        description: `La escuela "${selected.name}" ha sido eliminada correctamente.`,
      })
      setDeleteOpen(false)
      setSelected(null)
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "No se pudo eliminar la escuela.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Schools List</CardTitle>
                    <CardDescription>Manage all schools from here.</CardDescription>
                  </div>
                  <Button className="gap-2" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Add New School
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <SchoolsTable
                    schools={schools}
                    isLoading={isLoading}
                    onViewSchool={openView}
                    onEditSchool={openEdit}
                    onDeleteSchool={openDelete}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <SchoolDialog open={formOpen} onOpenChange={setFormOpen} school={editing} onSave={handleSave} isLoading={busy} />

      {selected && (
        <DeleteSchoolDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          school={selected}
          onConfirm={confirmDelete}
          isLoading={busy}
        />
      )}

      {selected && !editing && (
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>School Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">ID</label>
                <p className="text-lg font-semibold">#{selected.schoolid}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Nombre</label>
                <p className="text-lg font-semibold">{selected.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ubicación</label>
                <p className="text-lg">{selected.location}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
