"use client"

import { useState } from "react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Edit, Copy, Trash, Plus, Search, FileIcon } from "lucide-react"
import { TemplateEditor } from "@/components/template-editor"

// Datos de ejemplo para las plantillas
const templateData = [
  {
    id: 1,
    name: "Bienvenida",
    description: "Email de bienvenida para nuevos usuarios",
    category: "Onboarding",
    lastModified: "12 Abr, 2025",
    thumbnail: "/templates/welcome.png",
    hasAttachments: false,
  },
  {
    id: 2,
    name: "Confirmación de Compra",
    description: "Confirmación de compra con detalles del pedido",
    category: "Transaccional",
    lastModified: "10 Abr, 2025",
    thumbnail: "/templates/purchase.png",
    hasAttachments: true,
  },
  {
    id: 3,
    name: "Promoción Mensual",
    description: "Promoción mensual con descuentos especiales",
    category: "Marketing",
    lastModified: "5 Abr, 2025",
    thumbnail: "/templates/promo.png",
    hasAttachments: true,
  },
  {
    id: 4,
    name: "Recordatorio de Cita",
    description: "Recordatorio de cita programada",
    category: "Recordatorio",
    lastModified: "2 Abr, 2025",
    thumbnail: "/templates/reminder.png",
    hasAttachments: false,
  },
]

export function MarketingTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTemplates = templateData.filter(
    (template) =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEditTemplate = (id: number) => {
    setSelectedTemplate(id)
  }

  const handleCloseEditor = () => {
    setSelectedTemplate(null)
  }

  return (
    <>
      {selectedTemplate ? (
        <TemplateEditor template={templateData.find((t) => t.id === selectedTemplate)!} onClose={handleCloseEditor} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Plantillas de Email</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Plantilla
            </Button>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar plantillas..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Vista previa no disponible
                  </div>
                </div>
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                </CardHeader>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div>Modificado: {template.lastModified}</div>
                    {template.hasAttachments && (
                      <div className="flex items-center gap-1">
                        <FileIcon className="h-3 w-3" />
                        <span>Adjuntos</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditTemplate(template.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  )
}
