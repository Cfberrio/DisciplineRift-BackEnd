/**
 * Marketing Templates Component
 *
 * This component displays a grid of email templates with search functionality
 * and options for creating, editing, copying, and deleting templates.
 *
 * INTEGRATION GUIDE:
 * 1. This component uses the useEmailTemplates hook for data fetching and CRUD operations
 * 2. Customize the template card display to match your design requirements
 * 3. Adjust the template editor integration based on your application's needs
 *
 * DATA FLOW:
 * 1. Component mounts → useEmailTemplates hook fetches templates
 * 2. User can search, create, edit, or delete templates
 * 3. Template editor is shown when creating or editing a template
 * 4. Changes are saved back to the API via the hook's methods
 */

"use client"

import { useState } from "react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Copy, Trash, Plus, Search, FileIcon } from "lucide-react"
import { TemplateEditor } from "./template-editor"
import { useEmailTemplates } from "@/lib/hooks/use-marketing"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Marketing Templates Component
 *
 * @returns JSX.Element - The rendered component
 *
 * USAGE EXAMPLE:
 * ```tsx
 * <MarketingTemplates />
 * ```
 */
export function MarketingTemplates() {
  /**
   * Fetch templates data using the custom hook
   *
   * CUSTOMIZATION POINT:
   * - Add parameters to useEmailTemplates if you need to filter templates initially
   * - Add error handling UI based on the error state
   */
  const { templates, isLoading, error, addTemplate, editTemplate, removeTemplate } = useEmailTemplates()

  // State for tracking which template is being edited
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  // State for search query
  const [searchQuery, setSearchQuery] = useState("")

  /**
   * Filter templates based on search query
   *
   * CUSTOMIZATION POINT:
   * - Adjust the filtering logic based on your search requirements
   * - Add additional filters (e.g., by category, date, etc.)
   */
  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  /**
   * Handles opening the template editor for editing
   *
   * @param {number} id - The ID of the template to edit
   */
  const handleEditTemplate = (id: number) => {
    setSelectedTemplate(id)
  }

  /**
   * Handles closing the template editor
   */
  const handleCloseEditor = () => {
    setSelectedTemplate(null)
  }

  /**
   * Handles saving template changes
   *
   * @param {number} id - The ID of the template being edited
   * @param {any} templateData - The updated template data
   *
   * CUSTOMIZATION POINT:
   * - Add validation before saving
   * - Add success/error notifications
   * - Add optimistic updates for better UX
   */
  const handleSaveTemplate = async (id: number, templateData: any) => {
    try {
      await editTemplate(id, templateData)
      setSelectedTemplate(null)
      // CUSTOMIZATION POINT: Add success notification
      // toast.success("Template updated successfully");
    } catch (err) {
      console.error("Error saving template:", err)
      // CUSTOMIZATION POINT: Add error notification
      // toast.error("Failed to update template");
    }
  }

  /**
   * Handles deleting a template
   *
   * @param {number} id - The ID of the template to delete
   *
   * CUSTOMIZATION POINT:
   * - Add confirmation dialog before deletion
   * - Add success/error notifications
   */
  const handleDeleteTemplate = async (id: number) => {
    try {
      // CUSTOMIZATION POINT: Add confirmation dialog
      // if (!confirm("Are you sure you want to delete this template?")) return;

      await removeTemplate(id)

      // CUSTOMIZATION POINT: Add success notification
      // toast.success("Template deleted successfully");
    } catch (err) {
      console.error("Error deleting template:", err)
      // CUSTOMIZATION POINT: Add error notification
      // toast.error("Failed to delete template");
    }
  }

  /**
   * Handles creating a new template
   *
   * CUSTOMIZATION POINT:
   * - Customize the default template properties
   * - Add success/error notifications
   */
  const handleCreateTemplate = async () => {
    try {
      const newTemplate = await addTemplate({
        name: "Nueva Plantilla",
        description: "Descripción de la nueva plantilla",
        category: "Marketing",
        content: "<p>Contenido de la plantilla...</p>",
        lastModified: new Date().toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        attachments: [],
      })

      // Open the editor for the new template
      setSelectedTemplate(newTemplate.id)

      // CUSTOMIZATION POINT: Add success notification
      // toast.success("Template created successfully");
    } catch (err) {
      console.error("Error creating template:", err)
      // CUSTOMIZATION POINT: Add error notification
      // toast.error("Failed to create template");
    }
  }

  // If a template is selected for editing, show the template editor
  if (selectedTemplate) {
    const template = templates.find((t) => t.id === selectedTemplate)
    if (!template) return null

    return (
      <TemplateEditor
        template={template}
        onClose={handleCloseEditor}
        onSave={(data) => handleSaveTemplate(template.id, data)}
      />
    )
  }

  // Otherwise, show the templates grid
  return (
    <>
      {/* Header with title and create button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Plantillas de Email</h2>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar plantillas..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video" />
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        /* Templates grid */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              {/* Template preview */}
              <div className="aspect-video bg-muted relative">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  Vista previa no disponible
                </div>
              </div>
              {/* Template header with title, description, and category */}
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
              </CardHeader>
              {/* Template footer with last modified date and actions */}
              <CardFooter className="p-4 pt-0 flex justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div>Modificado: {template.lastModified}</div>
                  {template.attachments.length > 0 && (
                    <div className="flex items-center gap-1">
                      <FileIcon className="h-3 w-3" />
                      <span>Adjuntos ({template.attachments.length})</span>
                    </div>
                  )}
                </div>
                {/* Template actions */}
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template.id)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
          Error al cargar las plantillas: {error.message}
        </div>
      )}
    </>
  )
}
