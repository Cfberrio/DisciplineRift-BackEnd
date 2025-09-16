"use client";

import { useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSchools } from "@/contexts/schools-context";
import { SchoolDialog } from "./school-dialog";
import { DeleteSchoolDialog } from "./delete-school-dialog";
import type { School } from "@/lib/db/school-service";

export function SchoolsTable() {
  const { schools = [], isLoading = false, error } = useSchools() || {};
  const [searchTerm, setSearchTerm] = useState("");
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  // Ensure schools is always an array before filtering
  const safeSchools = Array.isArray(schools) ? schools : [];

  // Filter schools based on search term
  const filteredSchools = safeSchools.filter((school) => {
    if (!school) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      school.name?.toLowerCase().includes(searchLower) ||
      school.location?.toLowerCase().includes(searchLower) ||
      school.phone?.toLowerCase().includes(searchLower)
    );
  });

  const handleEdit = (school: School) => {
    setSelectedSchool(school);
    setShowSchoolDialog(true);
  };

  const handleDelete = (school: School) => {
    setSelectedSchool(school);
    setShowDeleteDialog(true);
  };

  const handleCloseDialog = () => {
    setShowSchoolDialog(false);
    setSelectedSchool(null);
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setSelectedSchool(null);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>Error loading schools: {error.message}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Escuelas</CardTitle>
              <CardDescription>
                Administra las escuelas de tu organización
              </CardDescription>
            </div>
            <Button onClick={() => setShowSchoolDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Escuela
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, ubicación o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
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
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        {searchTerm
                          ? "No se encontraron escuelas"
                          : "No hay escuelas registradas"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => (
                      <TableRow key={school.schoolid}>
                        <TableCell className="font-medium">
                          {school.name}
                        </TableCell>
                        <TableCell>{school.location || "-"}</TableCell>
                        <TableCell>{school.phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Activa</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(school)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(school)}
                            >
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

      <SchoolDialog
        open={showSchoolDialog}
        onClose={handleCloseDialog}
        initialData={selectedSchool}
      />

      <DeleteSchoolDialog
        open={showDeleteDialog}
        onOpenChange={handleCloseDeleteDialog}
        school={selectedSchool}
      />
    </>
  );
}
