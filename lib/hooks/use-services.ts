"use client"

import { useState, useEffect, useCallback } from "react"
import {
  fetchServices,
  fetchServiceById,
  createService,
  updateService,
  deleteService,
} from "@/lib/api/services-service"
import type { Service } from "@/lib/api/types"

/**
 * Custom hook for managing services data and operations
 *
 * This hook provides:
 * - Services data fetching and state management
 * - CRUD operations for services
 * - Loading and error states
 */
export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch all services
   */
  const fetchAllServices = useCallback(async (options?: { category?: string; search?: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchServices(options)
      setServices(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch services"))
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Fetch a single service by ID
   */
  const getServiceById = useCallback(async (id: number): Promise<Service> => {
    try {
      return await fetchServiceById(id)
    } catch (err) {
      throw err instanceof Error ? err : new Error(`Failed to fetch service with ID ${id}`)
    }
  }, [])

  /**
   * Add a new service
   */
  const addService = useCallback(async (service: Omit<Service, "id">): Promise<Service> => {
    try {
      const newService = await createService(service)
      return newService
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to create service")
    }
  }, [])

  /**
   * Edit an existing service
   */
  const editService = useCallback(async (id: number, service: Partial<Service>): Promise<Service> => {
    try {
      const updatedService = await updateService(id, service)
      return updatedService
    } catch (err) {
      throw err instanceof Error ? err : new Error(`Failed to update service with ID ${id}`)
    }
  }, [])

  /**
   * Remove a service
   */
  const removeService = useCallback(async (id: number): Promise<void> => {
    try {
      await deleteService(id)
    } catch (err) {
      throw err instanceof Error ? err : new Error(`Failed to delete service with ID ${id}`)
    }
  }, [])

  /**
   * Refetch all services
   */
  const refetch = useCallback(() => {
    return fetchAllServices()
  }, [fetchAllServices])

  // Initial fetch on mount
  useEffect(() => {
    fetchAllServices()
  }, [fetchAllServices])

  return {
    services,
    isLoading,
    error,
    getServiceById,
    addService,
    editService,
    removeService,
    refetch,
  }
}
