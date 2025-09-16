"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { School } from "@/lib/db/school-service"
import { useToast } from "@/hooks/use-toast"

interface SchoolFormProps {
  initialData?: School
  onSubmit: (data: Omit<School, "schoolid">) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function SchoolForm({ initialData, onSubmit, onCancel, isLoading = false }: SchoolFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<Omit<School, "schoolid">>({
    name: initialData?.name || "",
    location: initialData?.location || "",
  })

  const isEditing = !!initialData

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "School name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.location.trim()) {
      toast({
        title: "Error",
        description: "School location is required",
        variant: "destructive",
      })
      return
    }

    try {
      await onSubmit(formData)
      toast({
        title: "Success",
        description: isEditing ? "School updated successfully" : "School created successfully",
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: isEditing ? "Error al actualizar la escuela" : "Error al crear la escuela",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full border-0 shadow-none">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 p-0">
          <div className="space-y-2">
            <Label htmlFor="name">School Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Ex: Deerwood Elementary School"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Ex: 123 Main St, Jacksonville, FL"
              disabled={isLoading}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between p-0 pt-6">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditing ? "Update School" : "Create School"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
