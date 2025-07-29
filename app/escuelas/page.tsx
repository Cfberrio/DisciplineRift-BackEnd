"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { SchoolsTable } from "@/features/schools/schools-table";
import { SchoolDialog } from "@/features/schools/school-dialog";
import { DeleteSchoolDialog } from "@/features/schools/delete-school-dialog";
import { SchoolsProvider, useSchools } from "@/contexts/schools-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

function EscuelasContent() {
  const schoolsContext = useSchools();
  const schools = schoolsContext?.schools || [];
  const isLoading = schoolsContext?.isLoading || false;
  const addSchool = schoolsContext?.addSchool;
  const updateSchool = schoolsContext?.updateSchool;
  const removeSchool = schoolsContext?.removeSchool;

  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleViewSchool = (id: number) => {
    const school = schools.find((s) => s.schoolid === id);
    if (school) {
      setSelectedSchool(school);
      setEditingSchool(null);
      setIsDialogOpen(true);
    }
  };

  const handleEditSchool = (id: number) => {
    const school = schools.find((s) => s.schoolid === id);
    if (school) {
      setSelectedSchool(school);
      setEditingSchool(school);
      setIsDialogOpen(true);
    }
  };

  const handleDeleteSchool = (id: number) => {
    const school = schools.find((s) => s.schoolid === id);
    if (school) {
      setSelectedSchool(school);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleCreateSchool = () => {
    setSelectedSchool(null);
    setEditingSchool(null);
    setIsDialogOpen(true);
  };

  const handleSaveSchool = async (schoolData: any) => {
    try {
      setActionLoading(true);

      if (editingSchool && updateSchool) {
        await updateSchool(editingSchool.schoolid, schoolData);
        toast({
          title: "Éxito",
          description: "Escuela actualizada correctamente",
        });
      } else if (addSchool) {
        await addSchool(schoolData);
        toast({
          title: "Éxito",
          description: "Escuela creada correctamente",
        });
      }

      setIsDialogOpen(false);
      setSelectedSchool(null);
      setEditingSchool(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la escuela",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedSchool && removeSchool) {
      try {
        setActionLoading(true);
        await removeSchool(selectedSchool.schoolid);
        setIsDeleteDialogOpen(false);
        setSelectedSchool(null);

        toast({
          title: "Éxito",
          description: `La escuela "${selectedSchool.name}" ha sido eliminada correctamente.`,
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar la escuela.",
          variant: "destructive",
        });
      } finally {
        setActionLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <div className="space-y-4">
              <SchoolsTable
                schools={schools}
                isLoading={isLoading}
                onViewSchool={handleViewSchool}
                onEditSchool={handleEditSchool}
                onDeleteSchool={handleDeleteSchool}
              />
            </div>
          </div>
        </main>
      </div>

      <SchoolDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        school={editingSchool}
        onSave={handleSaveSchool}
        isLoading={actionLoading}
      />

      {selectedSchool && (
        <DeleteSchoolDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          school={selectedSchool}
        />
      )}

      {selectedSchool && !editingSchool && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Detalles de la Escuela</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">ID</label>
                <p className="text-lg font-semibold">
                  #{selectedSchool.schoolid}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Nombre
                </label>
                <p className="text-lg font-semibold">{selectedSchool.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Ubicación
                </label>
                <p className="text-lg">{selectedSchool.location}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function EscuelasPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <SchoolsProvider>
        <EscuelasContent />
      </SchoolsProvider>
    </ProtectedRoute>
  );
}
