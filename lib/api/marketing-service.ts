/**
 * Marketing API Service
 *
 * This module handles all API interactions related to marketing features,
 * including email templates, automations, and marketing metrics.
 *
 * INTEGRATION GUIDE:
 * 1. Replace the API endpoint URLs with your actual endpoints
 * 2. Adjust request parameters and body structure according to your API
 * 3. Modify response handling to match your API's data structure
 * 4. Add authentication and error handling specific to your API
 */

import type { EmailTemplate, Automation, MarketingMetrics } from "./types"

/**
 * ==========================================
 * EMAIL TEMPLATES API METHODS
 * ==========================================
 */

/**
 * Fetches all email templates
 *
 * @param {Object} options - Optional parameters for filtering and pagination
 * @returns {Promise<EmailTemplate[]>} Promise resolving to an array of email templates
 *
 * CUSTOMIZATION POINT:
 * - Add query parameters specific to your API's filtering capabilities
 * - Adjust response transformation if your API returns templates in a different format
 */
export async function fetchTemplates(options?: {
  category?: string
  search?: string
  page?: number
}): Promise<EmailTemplate[]> {
  try {
    // Construct URL with query parameters if provided
    let url = "/api/templates"
    if (options) {
      const params = new URLSearchParams()
      if (options.category) params.append("category", options.category)
      if (options.search) params.append("search", options.search)
      if (options.page) params.append("page", options.page.toString())

      if (params.toString()) {
        url += `?${params.toString()}`
      }
    }

    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || "Failed to fetch templates")
    }

    // CUSTOMIZATION POINT: Transform the response if your API returns data in a different structure
    // For example, if templates are nested in a 'data' property:
    // const responseData = await response.json();
    // return responseData.data;

    return await response.json()
  } catch (error) {
    console.error("Error fetching templates:", error)
    throw error
  }
}

/**
 * Fetches a single email template by ID
 *
 * @param {number} id - The ID of the template to fetch
 * @returns {Promise<EmailTemplate>} Promise resolving to the template data
 */
export async function fetchTemplateById(id: number): Promise<EmailTemplate> {
  try {
    const response = await fetch(`/api/templates/${id}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `Failed to fetch template with ID ${id}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching template with ID ${id}:`, error)
    throw error
  }
}

/**
 * Creates a new email template
 *
 * @param {Omit<EmailTemplate, "id">} template - The template data to create
 * @returns {Promise<EmailTemplate>} Promise resolving to the created template
 *
 * CUSTOMIZATION POINT:
 * - Adjust the request body format to match your API's expected input
 * - Handle file uploads for template attachments if your API supports it
 */
export async function createTemplate(template: Omit<EmailTemplate, "id">): Promise<EmailTemplate> {
  try {
    // CUSTOMIZATION POINT: If your API requires a different format for creating templates,
    // transform the template object here before sending

    const response = await fetch("/api/templates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authentication headers if needed
      },
      body: JSON.stringify(template),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || "Failed to create template")
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating template:", error)
    throw error
  }
}

/**
 * Updates an existing email template
 *
 * @param {number} id - The ID of the template to update
 * @param {Partial<EmailTemplate>} template - The partial template data to update
 * @returns {Promise<EmailTemplate>} Promise resolving to the updated template
 */
export async function updateTemplate(id: number, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
  try {
    const response = await fetch(`/api/templates/${id}`, {
      method: "PUT", // or "PATCH" for partial updates, depending on your API
      headers: {
        "Content-Type": "application/json",
        // Add authentication headers if needed
      },
      body: JSON.stringify(template),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `Failed to update template with ID ${id}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error updating template with ID ${id}:`, error)
    throw error
  }
}

/**
 * Deletes an email template
 *
 * @param {number} id - The ID of the template to delete
 * @returns {Promise<void>} Promise resolving when the template is deleted
 */
export async function deleteTemplate(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/templates/${id}`, {
      method: "DELETE",
      // Add authentication headers if needed
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `Failed to delete template with ID ${id}`)
    }
  } catch (error) {
    console.error(`Error deleting template with ID ${id}:`, error)
    throw error
  }
}

/**
 * ==========================================
 * AUTOMATIONS API METHODS
 * ==========================================
 */

/**
 * Fetches all automations
 *
 * @param {Object} options - Optional parameters for filtering and pagination
 * @returns {Promise<Automation[]>} Promise resolving to an array of automations
 */
export async function fetchAutomations(options?: {
  status?: "active" | "inactive"
  trigger?: string
  search?: string
}): Promise<Automation[]> {
  try {
    // Construct URL with query parameters if provided
    let url = "/api/automations"
    if (options) {
      const params = new URLSearchParams()
      if (options.status) params.append("status", options.status)
      if (options.trigger) params.append("trigger", options.trigger)
      if (options.search) params.append("search", options.search)

      if (params.toString()) {
        url += `?${params.toString()}`
      }
    }

    const response = await fetch(url)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || "Failed to fetch automations")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching automations:", error)
    throw error
  }
}

/**
 * Fetches a single automation by ID
 *
 * @param {number} id - The ID of the automation to fetch
 * @returns {Promise<Automation>} Promise resolving to the automation data
 */
export async function fetchAutomationById(id: number): Promise<Automation> {
  try {
    const response = await fetch(`/api/automations/${id}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `Failed to fetch automation with ID ${id}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error fetching automation with ID ${id}:`, error)
    throw error
  }
}

/**
 * Creates a new automation
 *
 * @param {Omit<Automation, "id">} automation - The automation data to create
 * @returns {Promise<Automation>} Promise resolving to the created automation
 */
export async function createAutomation(automation: Omit<Automation, "id">): Promise<Automation> {
  try {
    const response = await fetch("/api/automations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authentication headers if needed
      },
      body: JSON.stringify(automation),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || "Failed to create automation")
    }

    return await response.json()
  } catch (error) {
    console.error("Error creating automation:", error)
    throw error
  }
}

/**
 * Updates an existing automation
 *
 * @param {number} id - The ID of the automation to update
 * @param {Partial<Automation>} automation - The partial automation data to update
 * @returns {Promise<Automation>} Promise resolving to the updated automation
 */
export async function updateAutomation(id: number, automation: Partial<Automation>): Promise<Automation> {
  try {
    const response = await fetch(`/api/automations/${id}`, {
      method: "PUT", // or "PATCH" for partial updates
      headers: {
        "Content-Type": "application/json",
        // Add authentication headers if needed
      },
      body: JSON.stringify(automation),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `Failed to update automation with ID ${id}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error updating automation with ID ${id}:`, error)
    throw error
  }
}

/**
 * Deletes an automation
 *
 * @param {number} id - The ID of the automation to delete
 * @returns {Promise<void>} Promise resolving when the automation is deleted
 */
export async function deleteAutomation(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/automations/${id}`, {
      method: "DELETE",
      // Add authentication headers if needed
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || `Failed to delete automation with ID ${id}`)
    }
  } catch (error) {
    console.error(`Error deleting automation with ID ${id}:`, error)
    throw error
  }
}

/**
 * ==========================================
 * MARKETING METRICS API METHODS
 * ==========================================
 */

/**
 * Fetches marketing metrics
 *
 * @param {string} period - Time period for metrics (e.g., '7days', '30days', '90days', 'year')
 * @returns {Promise<MarketingMetrics>} Promise resolving to marketing metrics data
 *
 * CUSTOMIZATION POINT:
 * - Add additional parameters specific to your API's metrics filtering capabilities
 * - Transform the response if your API returns metrics in a different format
 */
export async function fetchMarketingMetrics(period = "30days"): Promise<MarketingMetrics> {
  try {
    const response = await fetch(`/api/metrics?period=${period}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(errorData?.message || "Failed to fetch marketing metrics")
    }

    // CUSTOMIZATION POINT: Transform the response if your API returns data in a different structure
    return await response.json()
  } catch (error) {
    console.error("Error fetching marketing metrics:", error)
    throw error
  }
}

/**
 * Example of additional marketing API methods you might need:
 *
 * export async function fetchCampaignPerformance(campaignId: number): Promise<CampaignPerformance> {
 *   // Implementation
 * }
 *
 * export async function sendTestEmail(templateId: number, email: string): Promise<void> {
 *   // Implementation
 * }
 *
 * export async function scheduleEmailCampaign(campaign: EmailCampaign): Promise<ScheduledCampaign> {
 *   // Implementation
 * }
 */
