"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Save,
  Eye,
  Code,
  ImageIcon,
  Link,
  ListOrdered,
  Bold,
  Italic,
  Underline,
  Plus,
  Trash,
  FileIcon,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Template {
  id: number
  name: string
  description: string
  category: string
  lastModified: string
  thumbnail?: string
}

interface TemplateEditorProps {
  template: Template
  onClose: () => void
}

export function TemplateEditor({ template, onClose }: TemplateEditorProps) {
  const [activeTab, setActiveTab] = useState("editor")
  const [templateName, setTemplateName] = useState(template.name)
  const [templateContent, setTemplateContent] = useState("<p>Contenido de la plantilla...</p>")
  const [attachments, setAttachments] = useState<Array<{ name: string; size: string; type: string }>>([])

  // Define variables for template insertion
  const nombre_cliente = "{{nombre_cliente}}"
  const fecha_compra = "{{fecha_compra}}"
  const producto = "{{producto}}"
  const precio = "{{precio}}"

  // Función para manejar la adición de archivos adjuntos
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + " KB",
        type: file.type,
      }))

      setAttachments([...attachments, ...newFiles])
    }
  }

  // Función para eliminar un archivo adjunto
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments]
    newAttachments.splice(index, 1)
    setAttachments(newAttachments)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-2xl font-semibold">Editar Plantilla</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Detalles de la Plantilla</CardTitle>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                  <Input id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="template-category">Categoría</Label>
                  <Select defaultValue={template.category}>
                    <SelectTrigger id="template-category">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Onboarding">Onboarding</SelectItem>
                      <SelectItem value="Transaccional">Transaccional</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Recordatorio">Recordatorio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center">
                  <CardTitle>Editor de Contenido</CardTitle>
                  <TabsList>
                    <TabsTrigger value="editor">
                      <Eye className="h-4 w-4 mr-2" />
                      Editor
                    </TabsTrigger>
                    <TabsTrigger value="code">
                      <Code className="h-4 w-4 mr-2" />
                      Código
                    </TabsTrigger>
                  </TabsList>
                </div>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <TabsContent value="editor" className="m-0">
                <div className="p-4 border-b">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Underline className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Link className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Insertar Variable" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nombre">{nombre_cliente}</SelectItem>
                        <SelectItem value="fecha">{fecha_compra}</SelectItem>
                        <SelectItem value="producto">{producto}</SelectItem>
                        <SelectItem value="precio">{precio}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="p-4 min-h-[400px]" dangerouslySetInnerHTML={{ __html: templateContent }} />
              </TabsContent>
              <TabsContent value="code" className="m-0">
                <div className="p-4 min-h-[400px]">
                  <textarea
                    className="w-full h-[400px] font-mono text-sm p-4 border rounded-md"
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                  />
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md p-4 min-h-[500px] bg-muted/20">
                <div className="text-center text-muted-foreground">Vista previa del email</div>
                <div className="mt-4" dangerouslySetInnerHTML={{ __html: templateContent }} />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa Completa
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Archivos Adjuntos</CardTitle>
            <div>
              <input type="file" id="file-attachment" className="hidden" multiple onChange={handleFileAttachment} />
              <Button variant="outline" onClick={() => document.getElementById("file-attachment")?.click()}>
                <Plus className="h-4 w-4 mr-2" />
                Adjuntar Archivo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {attachments.length === 0 ? (
            <div className="text-center p-6 text-muted-foreground">
              No hay archivos adjuntos. Haz clic en "Adjuntar Archivo" para añadir uno.
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <FileIcon className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {file.size} • {file.type}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeAttachment(index)}>
                    <Trash className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <div className="text-xs text-muted-foreground mt-2">
                Los archivos adjuntos se enviarán junto con el email.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
