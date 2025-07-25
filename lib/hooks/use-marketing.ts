/**
 * Marketing Hooks
 *
 * This file contains custom hooks for managing marketing-related data:
 * - useEmailTemplates: For managing email templates
 * - useAutomations: For managing email automations
 * - useMarketingMetrics: For fetching marketing metrics
 *
 * INTEGRATION GUIDE:
 * 1. Customize the API calls to match your backend requirements
 * 2. Adjust state management based on your application's needs
 * 3. Modify error handling to fit your error reporting strategy
 */

"use client"

import { useState, useEffect } from "react"
import type { EmailTemplate, Automation, MarketingMetrics } from "../api/types"
import {
  fetchTemplates,
  fetchTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  fetchAutomations,
  fetchAutomationById,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  fetchMarketingMetrics,
} from "../api/marketing-service"

/**
 * Hook for managing email templates
 *
 * @returns {Object} Email templates state and CRUD operations
 *
 * DATA FLOW:
 * 1. Component mounts → useEffect triggers initial templates fetch
 * 2. API request is made → loading state is set to true
 * 3. Response is received → templates are stored in state, loading set to false
 * 4. Component renders with templates → user interacts with UI
 * 5. CRUD operations update state and make API requests
 *
 * USAGE EXAMPLE:
 * ```tsx
 * const {
 *   templates,
 *   isLoading,
 *   error,
 *   addTemplate,
 *   editTemplate
 * } = useEmailTemplates();
 *
 * // Display templates
 * if (isLoading) return <Loading />;
 * return (
 *   <div>
 *     {templates.map(template => (
 *       <TemplateCard
 *         key={template.id}
 *         template={template}
 *         onEdit={() => editTemplate(template.id, { name: "Updated Name" })}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useEmailTemplates() {
  // State for storing templates data
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  // Loading state to track API request status
  const [isLoading, setIsLoading] = useState(true)
  // Error state to store any API errors
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch initial templates data on component mount
   *
   * CUSTOMIZATION POINT:
   * - Add parameters to fetchTemplates call if you need to filter initially
   * - Add dependencies to useEffect if you need to refetch based on prop changes
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // CUSTOMIZATION POINT: Add filtering parameters here
        // const data = await fetchTemplates({ category: 'marketing' });
        const data = await fetchTemplates()
        setTemplates(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, []) // CUSTOMIZATION POINT: Add dependencies if needed

  /**
   * Fetches a single template by ID
   *
   * @param {number} id - The ID of the template to fetch
   * @returns {Promise<EmailTemplate>} The fetched template
   */
  const getTemplateById = async (id: number) => {
    try {
      setIsLoading(true)
      const template = await fetchTemplateById(id)
      return template
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Adds a new template
   *
   * @param {Omit<EmailTemplate, "id">} template - The template data to create
   * @returns {Promise<EmailTemplate>} The created template with ID
   *
   * CUSTOMIZATION POINT:
   * - Add validation before sending to API
   * - Handle file uploads for template attachments if needed
   */
  const addTemplate = async (template: Omit<EmailTemplate, "id">) => {
    try {
      setIsLoading(true)

      // CUSTOMIZATION POINT: Add validation logic here
      // if (!template.name) throw new Error("Template name is required");

      // CUSTOMIZATION POINT: Handle file uploads if needed
      // if (template.attachments.length > 0) {
      //   const uploadedAttachments = await uploadAttachments(template.attachments);
      //   template.attachments = uploadedAttachments;
      // }

      const newTemplate = await createTemplate(template)
      setTemplates((prev) => [...prev, newTemplate])
      return newTemplate
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Updates an existing template
   *
   * @param {number} id - The ID of the template to update
   * @param {Partial<EmailTemplate>} template - The partial template data to update
   * @returns {Promise<EmailTemplate>} The updated template
   *
   * CUSTOMIZATION POINT:
   * - Add validation before sending to API
   * - Handle file uploads for template attachments if needed
   */
  const editTemplate = async (id: number, template: Partial<EmailTemplate>) => {
    try {
      setIsLoading(true)

      // CUSTOMIZATION POINT: Handle file uploads if needed
      // if (template.attachments && template.attachments.length > 0) {
      //   const uploadedAttachments = await uploadAttachments(template.attachments);
      //   template.attachments = uploadedAttachments;
      // }

      const updatedTemplate = await updateTemplate(id, template)
      setTemplates((prev) => prev.map((t) => (t.id === id ? updatedTemplate : t)))
      return updatedTemplate
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Removes a template
   *
   * @param {number} id - The ID of the template to delete
   *
   * CUSTOMIZATION POINT:
   * - Add confirmation before deletion
   * - Handle cleanup of associated resources (e.g., attachments)
   */
  const removeTemplate = async (id: number) => {
    try {
      setIsLoading(true)
      await deleteTemplate(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Refetches all templates data
   *
   * CUSTOMIZATION POINT:
   * - Add parameters to allow filtering on refetch
   */
  const refetch = async () => {
    try {
      setIsLoading(true)
      const data = await fetchTemplates()
      setTemplates(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    templates,
    isLoading,
    error,
    getTemplateById,
    addTemplate,
    editTemplate,
    removeTemplate,
    refetch,
  }
}

/**
 * Hook for managing automations
 *
 * @returns {Object} Automations state and CRUD operations
 *
 * USAGE EXAMPLE:
 * ```tsx
 * const {
 *   automations,
 *   isLoading,
 *   addAutomation,
 *   editAutomation
 * } = useAutomations();
 *
 * // Toggle automation status
 * const handleToggleStatus = (id, status) => {
 *   editAutomation(id, { status: status === 'active' ? 'inactive' : 'active' });
 * };
 * ```
 */
export function useAutomations() {
  // State for storing automations data
  const [automations, setAutomations] = useState<Automation[]>([])
  // Loading state to track API request status
  const [isLoading, setIsLoading] = useState(true)
  // Error state to store any API errors
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch initial automations data on component mount
   *
   * CUSTOMIZATION POINT:
   * - Add parameters to fetchAutomations call if you need to filter initially
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        // CUSTOMIZATION POINT: Add filtering parameters here
        // const data = await fetchAutomations({ status: 'active' });
        const data = await fetchAutomations()
        setAutomations(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  /**
   * Fetches a single automation by ID
   *
   * @param {number} id - The ID of the automation to fetch
   * @returns {Promise<Automation>} The fetched automation
   */
  const getAutomationById = async (id: number) => {
    try {
      setIsLoading(true)
      const automation = await fetchAutomationById(id)
      return automation
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Adds a new automation
   *
   * @param {Omit<Automation, "id">} automation - The automation data to create
   * @returns {Promise<Automation>} The created automation with ID
   *
   * CUSTOMIZATION POINT:
   * - Add validation before sending to API
   * - Add integration with template selection
   */
  const addAutomation = async (automation: Omit<Automation, "id">) => {
    try {
      setIsLoading(true)

      // CUSTOMIZATION POINT: Add validation logic here
      // if (!automation.name) throw new Error("Automation name is required");
      // if (!automation.templateId) throw new Error("Template selection is required");

      const newAutomation = await createAutomation(automation)
      setAutomations((prev) => [...prev, newAutomation])
      return newAutomation
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Updates an existing automation
   *
   * @param {number} id - The ID of the automation to update
   * @param {Partial<Automation>} automation - The partial automation data to update
   * @returns {Promise<Automation>} The updated automation
   *
   * CUSTOMIZATION POINT:
   * - Add validation before sending to API
   * - Add special handling for status changes (e.g., logging, notifications)
   */
  const editAutomation = async (id: number, automation: Partial<Automation>) => {
    try {
      setIsLoading(true)

      // CUSTOMIZATION POINT: Add special handling for status changes
      // if (automation.status === 'active') {
      //   // Log activation or send notification
      //   logAutomationActivation(id);
      // }

      const updatedAutomation = await updateAutomation(id, automation)
      setAutomations((prev) => prev.map((a) => (a.id === id ? updatedAutomation : a)))
      return updatedAutomation
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Removes an automation
   *
   * @param {number} id - The ID of the automation to delete
   *
   * CUSTOMIZATION POINT:
   * - Add confirmation before deletion
   * - Add special handling for active automations
   */
  const removeAutomation = async (id: number) => {
    try {
      setIsLoading(true)

      // CUSTOMIZATION POINT: Add special handling for active automations
      // const automation = automations.find(a => a.id === id);
      // if (automation?.status === 'active') {
      //   // Confirm deletion of active automation
      //   if (!confirm('This automation is active. Are you sure you want to delete it?')) {
      //     setIsLoading(false);
      //     return;
      //   }
      // }

      await deleteAutomation(id)
      setAutomations((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Refetches all automations data
   */
  const refetch = async () => {
    try {
      setIsLoading(true)
      const data = await fetchAutomations()
      setAutomations(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  return {
    automations,
    isLoading,
    error,
    getAutomationById,
    addAutomation,
    editAutomation,
    removeAutomation,
    refetch,
  }
}

/**
 * Hook for fetching marketing metrics
 *
 * @param {string} period - Time period for metrics (default: "30days")
 * @returns {Object} Marketing metrics state and refetch function
 *
 * USAGE EXAMPLE:
 * ```tsx
 * const { metrics, isLoading, refetch } = useMarketingMetrics('7days');
 *
 * // Change period and refetch
 * const handlePeriodChange = (newPeriod) => {
 *   refetch(newPeriod);
 * };
 * ```
 */
export function useMarketingMetrics(period = "30days") {
  // State for storing metrics data
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null)
  // Loading state to track API request status
  const [isLoading, setIsLoading] = useState(true)
  // Error state to store any API errors
  const [error, setError] = useState<Error | null>(null)

  /**
   * Fetch metrics data on component mount and when period changes
   *
   * CUSTOMIZATION POINT:
   * - Add additional parameters for more detailed metrics filtering
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const data = await fetchMarketingMetrics(period)
        setMetrics(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period]) // Re-fetch when period changes

  /**
   * Refetches metrics data, optionally with a new period
   *
   * @param {string} newPeriod - Optional new time period for metrics
   *
   * CUSTOMIZATION POINT:
   * - Add additional parameters for more detailed metrics filtering
   */
  const refetch = async (newPeriod?: string) => {
    try {
      setIsLoading(true)
      const data = await fetchMarketingMetrics(newPeriod || period)
      setMetrics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  return { metrics, isLoading, error, refetch }
}
