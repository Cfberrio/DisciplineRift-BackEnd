"use client"

import { useState } from "react"
import { Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogoUpload } from "./logo-upload"
import { Skeleton } from "@/components/ui/skeleton"

interface LogoGeneratorProps {
  serviceName: string
  onLogoChange: (logo: string) => void
  initialLogo?: string
}

export function LogoGenerator({ serviceName, onLogoChange, initialLogo }: LogoGeneratorProps) {
  const [activeTab, setActiveTab] = useState<string>("upload")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [generatedLogos, setGeneratedLogos] = useState<string[]>([])
  const [selectedLogo, setSelectedLogo] = useState<string | null>(initialLogo || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState("")

  // Handle image upload
  const handleImageChange = (image: File | string | null) => {
    if (image instanceof File) {
      setUploadedImage(image)
      // In a real app, you would upload this to your server/cloud storage
      // and get back a URL to use
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setSelectedLogo(result)
        onLogoChange(result)
      }
      reader.readAsDataURL(image)
    } else if (image === null) {
      setUploadedImage(null)
      setSelectedLogo(null)
      onLogoChange("")
    }
  }

  // Generate logos based on service name and optional prompt
  const generateLogos = async () => {
    setIsGenerating(true)

    try {
      // In a real app, this would call an AI service to generate logos
      // For this demo, we'll simulate with placeholder images
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate 4 "AI" logos (using placeholders for demo)
      const basePrompt = prompt || serviceName
      const newLogos = [
        `/placeholder.svg?height=200&width=200&query=sports logo for ${basePrompt} with mascot`,
        `/placeholder.svg?height=200&width=200&query=minimalist logo for ${basePrompt}`,
        `/placeholder.svg?height=200&width=200&query=colorful emblem for ${basePrompt}`,
        `/placeholder.svg?height=200&width=200&query=modern logo for ${basePrompt} team`,
      ]

      setGeneratedLogos(newLogos)
    } catch (error) {
      console.error("Error generating logos:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Select a generated logo
  const selectLogo = (logo: string) => {
    setSelectedLogo(logo)
    onLogoChange(logo)
  }

  return (
    <div className="space-y-4">
      <Label>Logo del Servicio</Label>

      <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Subir Logo</TabsTrigger>
          <TabsTrigger value="generate">Generar Logo</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="pt-4">
          <LogoUpload
            initialImage={activeTab === "upload" ? selectedLogo || undefined : undefined}
            onImageChange={handleImageChange}
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="logo-prompt">Descripción del Logo (opcional)</Label>
            <div className="flex gap-2">
              <Input
                id="logo-prompt"
                placeholder={`Logo para ${serviceName}`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <Button
                type="button"
                onClick={generateLogos}
                disabled={isGenerating || !serviceName}
                className="whitespace-nowrap"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isGenerating ? "Generando..." : "Generar"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe cómo quieres que sea el logo. Por ejemplo: "Logo deportivo con un águila para voleibol"
            </p>
          </div>

          {isGenerating ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-md overflow-hidden border">
                  <Skeleton className="h-full w-full" />
                </div>
              ))}
            </div>
          ) : generatedLogos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {generatedLogos.map((logo, index) => (
                <div
                  key={index}
                  className={cn(
                    "aspect-square rounded-md overflow-hidden border p-2 cursor-pointer transition-all",
                    selectedLogo === logo ? "ring-2 ring-primary" : "hover:border-primary/50",
                  )}
                  onClick={() => selectLogo(logo)}
                >
                  <img
                    src={logo || "/placeholder.svg"}
                    alt={`Generated logo ${index + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
              <p className="text-muted-foreground text-center">
                Haz clic en "Generar" para crear opciones de logo basadas en el nombre del servicio
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function for conditional class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
