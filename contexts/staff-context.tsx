"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { staffApi, type Staff } from "@/lib/api/staff-api";
import { useToast } from "@/hooks/use-toast";
import { withRetry } from "@/lib/api/api-retry";

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

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("StaffContext: Fetching staff...");

      const data = await withRetry(
        () => staffApi.getAll(),
        {
          maxRetries: 3,
          baseTimeout: 60000, // 60 segundos
          retryDelay: 2000,
          onRetry: (attempt, error) => {
            console.log(`StaffContext: Reintentando (${attempt}/3)...`, error.message);
          },
        }
      );

      console.log("StaffContext: Fetched staff:", data?.length || 0, "records");

      const staffArray = Array.isArray(data) ? data : [];
      setStaff(staffArray);
      setError(null);
    } catch (err) {
      console.error("StaffContext: Error fetching staff:", err);
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      
      setError(errorMessage);
      setStaff([]);

      toast({
        title: "Error al cargar coaches",
        description: errorMessage.includes("timeout")
          ? "La conexión tardó demasiado. Por favor, intenta de nuevo."
          : "No se pudieron cargar los coaches. Haz clic en 'Reintentar'.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
