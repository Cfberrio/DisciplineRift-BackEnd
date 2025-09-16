"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { staffApi, type Staff } from "@/lib/api/staff-api";
import { useToast } from "@/hooks/use-toast";

interface StaffContextType {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  fetchStaff: () => Promise<void>;
  createStaff: (data: Omit<Staff, "id">) => Promise<void>;
  updateStaff: (id: string, data: Partial<Omit<Staff, "id">>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStaff = async (retryCount = 0) => {
    const maxRetries = 2;
    const baseTimeout = 30000; // 30 seconds base timeout
    const timeoutMultiplier = retryCount + 1;
    
    try {
      setLoading(true);
      setError(null);
      console.log("StaffContext: Fetching staff...", retryCount > 0 ? `(retry ${retryCount})` : "");

      // Progressive timeout increase with retries
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout")), baseTimeout * timeoutMultiplier);
      });

      const dataPromise = staffApi.getAll();
      const data = (await Promise.race([dataPromise, timeoutPromise])) as any;

      console.log("StaffContext: Fetched staff:", data?.length || 0, "records");

      // Ensure we always have an array
      const staffArray = Array.isArray(data) ? data : [];
      setStaff(staffArray);
      setError(null); // Clear any previous errors on success
    } catch (err) {
      console.error("StaffContext: Error fetching staff:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      
      // Retry logic for timeout and network errors
      if (retryCount < maxRetries && (errorMessage.includes("timeout") || errorMessage.includes("network") || errorMessage.includes("fetch"))) {
        console.log(`StaffContext: Retrying fetch staff in ${(retryCount + 1) * 2} seconds...`);
        setTimeout(() => {
          fetchStaff(retryCount + 1);
        }, (retryCount + 1) * 2000); // Progressive delay: 2s, 4s, 6s
        return; // Don't set error state yet, we're retrying
      }
      
      setError(errorMessage);
      setStaff([]); // Always set empty array on final error

      // Only show toast for final errors (not during retries)
      if (retryCount >= maxRetries) {
        toast({
          title: "Error",
          description: errorMessage.includes("timeout") 
            ? "La conexión tardó demasiado. Revisa tu conexión a internet."
            : "No se pudieron cargar los miembros del staff",
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

  const createStaff = async (data: Omit<Staff, "id">) => {
    try {
      console.log("StaffContext: Creating staff:", data);
      const newStaff = await staffApi.create(data);
      setStaff((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return [...prevArray, newStaff];
      });
      toast({
        title: "Staff creado",
        description: "El miembro del staff ha sido creado exitosamente",
      });
    } catch (err) {
      console.error("StaffContext: Error creating staff:", err);
      toast({
        title: "Error",
        description: "No se pudo crear el miembro del staff",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateStaff = async (id: string, data: Partial<Omit<Staff, "id">>) => {
    try {
      console.log("StaffContext: Updating staff:", id, data);
      const updatedStaff = await staffApi.update(id, data);
      setStaff((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map((s) => (s.id === id ? updatedStaff : s));
      });
      toast({
        title: "Staff actualizado",
        description: "El miembro del staff ha sido actualizado exitosamente",
      });
    } catch (err) {
      console.error("StaffContext: Error updating staff:", err);
      toast({
        title: "Error",
        description: "No se pudo actualizar el miembro del staff",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      console.log("StaffContext: Deleting staff:", id);
      await staffApi.delete(id);
      setStaff((prev) => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.filter((s) => s.id !== id);
      });
      toast({
        title: "Staff eliminado",
        description: "El miembro del staff ha sido eliminado exitosamente",
      });
    } catch (err) {
      console.error("StaffContext: Error deleting staff:", err);
      toast({
        title: "Error",
        description: "No se pudo eliminar el miembro del staff",
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  return (
    <StaffContext.Provider
      value={{
        staff,
        loading,
        error,
        fetchStaff,
        createStaff,
        updateStaff,
        deleteStaff,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return context;
}
