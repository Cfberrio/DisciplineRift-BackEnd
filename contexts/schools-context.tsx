"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { schoolsApi, type School } from "@/lib/api/schools-api"
import { useToast } from "@/hooks/use-toast"

interface SchoolsContextType {
  schools: School[]
  loading: boolean
  error: string | null
  fetchSchools: () => Promise<void>
  createSchool: (data: Omit<School, "id">) => Promise<void>
  updateSchool: (id: string, data: Partial<Omit<School, "id">>) => Promise<void>
  deleteSchool: (id: string) => Promise<void>
}

const SchoolsContext = createContext<SchoolsContextType | undefined>(undefined)

export function SchoolsProvider({ children }: { children: React.ReactNode }) {
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSchools = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("SchoolsContext: Fetching schools...")

      const data = await schoolsApi.getAll()
      console.log("SchoolsContext: Fetched schools:", data?.length || 0, "records")

      // Ensure we always have an array
      const schoolsArray = Array.isArray(data) ? data : []
      setSchools(schoolsArray)
    } catch (err) {
      console.error("SchoolsContext: Error fetching schools:", err)
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)
      setSchools([]) // Always set empty array on error
      toast({
        title: "Error",
        description: "No se pudieron cargar las escuelas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createSchool = async (data: Omit<School, "id">) => {
    try {
      console.log("SchoolsContext: Creating school:", data)
      const newSchool = await schoolsApi.create(data)
      setSchools((prev) => {
        const prevArray = Array.isArray(prev) ? prev : []
        return [...prevArray, newSchool]
      })
      toast({
        title: "Escuela creada",
        description: "La escuela ha sido creada exitosamente",
      })
    } catch (err) {
      console.error("SchoolsContext: Error creating school:", err)
      toast({
        title: "Error",
        description: "No se pudo crear la escuela",
        variant: "destructive",
      })
      throw err
    }
  }

  const updateSchool = async (id: string, data: Partial<Omit<School, "id">>) => {
    try {
      console.log("SchoolsContext: Updating school:", id, data)
      const updatedSchool = await schoolsApi.update(id, data)
      setSchools((prev) => {
        const prevArray = Array.isArray(prev) ? prev : []
        return prevArray.map((s) => (s.id === id ? updatedSchool : s))
      })
      toast({
        title: "Escuela actualizada",
        description: "La escuela ha sido actualizada exitosamente",
      })
    } catch (err) {
      console.error("SchoolsContext: Error updating school:", err)
      toast({
        title: "Error",
        description: "No se pudo actualizar la escuela",
        variant: "destructive",
      })
      throw err
    }
  }

  const deleteSchool = async (id: string) => {
    try {
      console.log("SchoolsContext: Deleting school:", id)
      await schoolsApi.delete(id)
      setSchools((prev) => {
        const prevArray = Array.isArray(prev) ? prev : []
        return prevArray.filter((s) => s.id !== id)
      })
      toast({
        title: "Escuela eliminada",
        description: "La escuela ha sido eliminada exitosamente",
      })
    } catch (err) {
      console.error("SchoolsContext: Error deleting school:", err)
      toast({
        title: "Error",
        description: "No se pudo eliminar la escuela",
        variant: "destructive",
      })
      throw err
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [])

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
      }}
    >
      {children}
    </SchoolsContext.Provider>
  )
}

export function useSchools() {
  const context = useContext(SchoolsContext)
  if (context === undefined) {
    throw new Error("useSchools must be used within a SchoolsProvider")
  }
  return context
}
