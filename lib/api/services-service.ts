/**
 * Services API Service
 *
 * This module handles all API interactions related to services data.
 * It provides CRUD operations for services management.
 */

import type { Service } from "./types"

/**
 * Fetches all services from the API
 */
export async function fetchServices(options?: {
  category?: string
  search?: string
  page?: number
  limit?: number
}): Promise<Service[]> {
  try {
    // Construct URL with query parameters if provided
    let url = "/api/services"
    if (options) {
      const params = new URLSearchParams()
      if (options.category) params.append("category", options.category)
      if (options.search) params.append("search", options.search)
      if (options.page) params.append("page", options.page.toString())
      if (options.limit) params.append("limit", options.limit.toString())

      if (params.toString()) {
        url += `?${params.toString()}`
      }
    }

    // Make the API request
    const response = await fetch(url)

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `Failed to fetch services: ${response.status}`)
    }

    // Parse and return the response data
    return await response.json()
  } catch (error) {
    console.error("Error fetching services:", error)
    throw error
  }
}

/**
 * Fetches a single service by ID
 */
export async function fetchServiceById(id: number): Promise<Service> {
  try {
    const response = await fetch(`/api/services/${id}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      const errorMessage = errorData?.error || `Failed to fetch service with ID ${id}: ${response.status}`

      // Create a custom error with additional properties
      const error = new Error(errorMessage)
      // @ts-ignore - Adding custom properties to the error
      error.status = response.status
      // @ts-ignore
      error.isNotFound = response.status === 404
      throw error
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching service with ID ${id}:`, error)
    throw error
  }
}

/**
 * Creates a new service
 */
export async function createService(service: Omit<Service, "id">): Promise<Service> {
  try {
    const response = await fetch("/api/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(service),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `Failed to create service: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating service:", error)
    throw error
  }
}

/**
 * Updates an existing service
 */
export async function updateService(id: number, service: Partial<Service>): Promise<Service> {
  try {
    const response = await fetch(`/api/services/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(service),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `Failed to update service with ID ${id}: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error updating service with ID ${id}:`, error)
    throw error
  }
}

/**
 * Deletes a service
 */
export async function deleteService(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/services/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    // Special handling for 404 errors - consider it a success if the service doesn't exist
    if (response.status === 404) {
      console.warn(`Service with ID ${id} not found, considering deletion successful`)
      return
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.error || `Failed to delete service with ID ${id}: ${response.status}`)
    }
  } catch (error) {
    console.error(`Error deleting service with ID ${id}:`, error)
    throw error
  }
}

// Convenience wrapper so other code can import { servicesApi } and
// access every CRUD helper in one place.
export const servicesApi = {
  getAll: fetchServices,
  getById: fetchServiceById,
  create: createService,
  update: updateService,
  delete: deleteService,
}
