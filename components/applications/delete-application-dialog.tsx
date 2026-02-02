"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DrteamApplication } from "@/lib/db/drteam-service"

interface DeleteApplicationDialogProps {
  application: DrteamApplication
  onDeleted: () => void
}

export function DeleteApplicationDialog({ application, onDeleted }: DeleteApplicationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Error deleting")
      }

      toast({
        title: "Application deleted",
        description: `Application for ${application.firstName} ${application.lastName} has been deleted successfully.`,
      })

      setOpen(false)
      onDeleted()
    } catch (error) {
      console.error("Error deleting application:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not delete application",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this application?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>This action cannot be undone. The following will be permanently deleted:</p>
                <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                  <div className="font-medium text-gray-900">
                    {application.firstName} {application.lastName}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {application.email}
                  </div>
                  <div className="text-sm text-gray-600">
                    {application.number}
                  </div>
                  {application.sport && (
                    <div className="text-sm text-gray-600">
                      Sport: {application.sport}
                    </div>
                  )}
                </div>
                {application.resume && (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ The resume file will also be deleted from storage.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
