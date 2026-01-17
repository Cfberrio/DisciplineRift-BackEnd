"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { Coupon } from "@/lib/db/coupon-service"
import { Loader2, AlertTriangle } from "lucide-react"

interface DeleteCouponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon: Coupon | null
  onSuccess: () => void
}

export function DeleteCouponDialog({
  open,
  onOpenChange,
  coupon,
  onSuccess,
}: DeleteCouponDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!coupon) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/coupons/${coupon.couponid}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete coupon")
      }

      toast({
        title: "Success",
        description: `Coupon "${coupon.code}" has been deleted`,
      })

      onSuccess()
    } catch (error: any) {
      console.error("Error deleting coupon:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete coupon",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Delete Coupon
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this coupon? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {coupon && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-500">Code:</span>
                <span className="ml-2 font-mono font-bold">{coupon.code}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Discount:</span>
                <span className="ml-2">{coupon.percentage}% OFF</span>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete Coupon
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
