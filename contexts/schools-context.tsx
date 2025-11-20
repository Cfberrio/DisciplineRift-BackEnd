"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { schoolsApi, type School } from "@/lib/api/schools-api";
import { useToast } from "@/hooks/use-toast";
import { withRetry } from "@/lib/api/api-retry";

interface SchoolsContextType {
  schools: School[];
  loading: boolean;
  error: string | null;
  fetchSchools: () => Promise<void>;
  createSchool: (data: Omit<School, "schoolid">) => Promise<void>;
  updateSchool: (
    id: string,
    data: Partial<Omit<School, "schoolid">>
  ) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
  removeSchool: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const SchoolsContext = createContext<SchoolsContextType | undefined>(undefined);

export function SchoolsProvider({ children }: { children: React.ReactNode }) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("SchoolsContext: Fetching schools...");

      const data = await withRetry(
        () => schoolsApi.getAll(),
        {
          maxRetries: 3,
          baseTimeout: 60000, // 60 segundos
          retryDelay: 2000,
          onRetry: (attempt, error) => {
            console.log(`SchoolsContext: Reintentando (${attempt}/3)...`, error.message);
          },
        }
      );

      console.log("SchoolsContext: Fetched schools:", data?.length || 0, "records");

      const schoolsArray = Array.isArray(data) ? data : [];
      setSchools(schoolsArray);
      setError(null);
    } catch (err) {
      console.error("SchoolsContext: Error fetching schools:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      
      setError(errorMessage);
      setSchools([]);

      toast({
        title: "Error al cargar escuelas",
        description: errorMessage.includes("timeout")
          ? "La conexión tardó demasiado. Por favor, intenta de nuevo."
          : "No se pudieron cargar las escuelas. Haz clic en 'Reintentar'.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createSchool = useCallback(async (data: Omit<School, "schoolid">) => {
    try {
      console.log("SchoolsContext: Creating school:", data);
      const newSchool = await schoolsApi.create(data);

      // Update local state immediately - no need for setTimeout refetch
      setSchools((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return [...prevArray, newSchool];
      });

      toast({
        title: "Escuela creada",
        description: "La escuela ha sido creada exitosamente",
      });
    } catch (err) {
      console.error("SchoolsContext: Error creating school:", err);
      toast({
        title: "Error",
        description: "No se pudo crear la escuela",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const updateSchool = useCallback(async (
    id: string,
    data: Partial<Omit<School, "id">>
  ) => {
    try {
      console.log("SchoolsContext: Updating school:", id, data);
      const updatedSchool = await schoolsApi.update(id, data);

      // Update local state immediately - no need for setTimeout refetch
      setSchools((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map((s) =>
          s.schoolid.toString() === id ? updatedSchool : s
        );
      });

      toast({
        title: "Escuela actualizada",
        description: "La escuela ha sido actualizada exitosamente",
      });
    } catch (err) {
      console.error("SchoolsContext: Error updating school:", err);
      toast({
        title: "Error",
        description: "No se pudo actualizar la escuela",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const deleteSchool = useCallback(async (id: string) => {
    try {
      console.log("SchoolsContext: Deleting school:", id);
      await schoolsApi.delete(id);

      // Update local state immediately - no need for setTimeout refetch
      setSchools((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.filter((s) => s.schoolid.toString() !== id);
      });

      toast({
        title: "Escuela eliminada",
        description: "La escuela ha sido eliminada exitosamente",
      });
    } catch (err) {
      console.error("SchoolsContext: Error deleting school:", err);
      toast({
        title: "Error",
        description: "No se pudo eliminar la escuela",
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const refreshData = useCallback(async () => {
    await fetchSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // FIX: Sin dependencias para prevenir loops infinitos

  useEffect(() => {
    // NO ejecutar en páginas de auth
    if (typeof window !== 'undefined' && 
        (window.location.pathname === '/login' || 
         window.location.pathname === '/unauthorized')) {
      console.log("SchoolsContext: Skipping fetch on auth page")
      setLoading(false)
      return
    }
    
    fetchSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // FIX: Sin dependencias para prevenir loops infinitos - fetchSchools se mantiene estable

  return (
    <SchoolsContext.Provider
      value={{
        schools,
        loading,
        error,
        fetchSchools,
        createSchool,
        updateSchool,
        deleteSchool,
        removeSchool: deleteSchool, // Alias for deleteSchool
        refreshData,
      }}
    >
      {children}
    </SchoolsContext.Provider>
  );
}

export function useSchools() {
  const context = useContext(SchoolsContext);
  if (context === undefined) {
    throw new Error("useSchools must be used within a SchoolsProvider");
  }
  return context;
}
