"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { schoolsApi, type School } from "@/lib/api/schools-api";
import { useToast } from "@/hooks/use-toast";

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

  const fetchSchools = async (retryCount = 0) => {
    const maxRetries = 2;
    const baseTimeout = 30000; // 30 seconds base timeout
    const timeoutMultiplier = retryCount + 1;
    
    try {
      setLoading(true);
      setError(null);
      console.log("SchoolsContext: Fetching schools...", retryCount > 0 ? `(retry ${retryCount})` : "");

      // Progressive timeout increase with retries
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), baseTimeout * timeoutMultiplier);
      });

      const dataPromise = schoolsApi.getAll();
      const data = (await Promise.race([dataPromise, timeoutPromise])) as any;

      console.log("SchoolsContext: Fetched schools:", data?.length || 0, "records");

      // Ensure we always have an array
      const schoolsArray = Array.isArray(data) ? data : [];
      setSchools(schoolsArray);
      setError(null); // Clear any previous errors on success
    } catch (err) {
      console.error("SchoolsContext: Error fetching schools:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      
      // Retry logic for timeout and network errors
      if (retryCount < maxRetries && (errorMessage.includes("timeout") || errorMessage.includes("network") || errorMessage.includes("fetch"))) {
        console.log(`SchoolsContext: Retrying fetch schools in ${(retryCount + 1) * 2} seconds...`);
        setTimeout(() => {
          fetchSchools(retryCount + 1);
        }, (retryCount + 1) * 2000); // Progressive delay: 2s, 4s, 6s
        return; // Don't set error state yet, we're retrying
      }
      
      setError(errorMessage);
      setSchools([]); // Always set empty array on final error

      // Only show toast for final errors (not during retries)
      if (retryCount >= maxRetries) {
        toast({
          title: "Error",
          description: errorMessage.includes("timeout") 
            ? "La conexión tardó demasiado. Revisa tu conexión a internet."
            : "No se pudieron cargar las escuelas",
          variant: "destructive",
        });
      }
    } finally {
      // Only set loading false if this is the final attempt or success
      if (retryCount >= maxRetries || !error) {
        setLoading(false);
      }
    }
  };

  const createSchool = async (data: Omit<School, "schoolid">) => {
    try {
      console.log("SchoolsContext: Creating school:", data);
      const newSchool = await schoolsApi.create(data);

      // Update local state immediately
      setSchools((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return [...prevArray, newSchool];
      });

      // Trigger a refetch to ensure data consistency
      setTimeout(() => {
        fetchSchools();
      }, 100);

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
  };

  const updateSchool = async (
    id: string,
    data: Partial<Omit<School, "id">>
  ) => {
    try {
      console.log("SchoolsContext: Updating school:", id, data);
      const updatedSchool = await schoolsApi.update(id, data);

      // Update local state immediately
      setSchools((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map((s) =>
          s.schoolid.toString() === id ? updatedSchool : s
        );
      });

      // Trigger a refetch to ensure data consistency
      setTimeout(() => {
        fetchSchools();
      }, 100);

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
  };

  const deleteSchool = async (id: string) => {
    try {
      console.log("SchoolsContext: Deleting school:", id);
      await schoolsApi.delete(id);

      // Update local state immediately
      setSchools((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.filter((s) => s.schoolid.toString() !== id);
      });

      // Trigger a refetch to ensure data consistency
      setTimeout(() => {
        fetchSchools();
      }, 100);

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
  };

  const refreshData = async () => {
    await fetchSchools();
  };

  useEffect(() => {
    fetchSchools();
  }, []);

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
