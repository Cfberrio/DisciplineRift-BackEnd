"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import type { Coupon } from "@/lib/db/coupon-service"
import { Loader2 } from "lucide-react"

interface CouponDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  coupon: Coupon | null
  onSuccess: () => void
}

export function CouponDialog({ open, onOpenChange, coupon, onSuccess }: CouponDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: "",
    percentage: 0,
    isactive: true,
  })

  useEffect(() => {
    if (coupon) {
      setFormData({
        code: coupon.code,
        percentage: coupon.percentage,
        isactive: coupon.isactive,
      })
    } else {
      setFormData({
        code: "",
        percentage: 0,
        isactive: true,
      })
    }
  }, [coupon, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validation
      if (!formData.code.trim()) {
        toast({
          title: "Error",
          description: "Coupon code is required",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (formData.percentage < 0 || formData.percentage > 100) {
        toast({
          title: "Error",
          description: "Percentage must be between 0 and 100",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const url = coupon
        ? `/api/coupons/${coupon.couponid}`
        : "/api/coupons"
      
      const method = coupon ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save coupon")
      }

      toast({
        title: "Success",
        description: `Coupon ${coupon ? "updated" : "created"} successfully`,
      })

      onSuccess()
    } catch (error: any) {
      console.error("Error saving coupon:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save coupon",
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
          <DialogTitle>
            {coupon ? "Edit Coupon" : "Create Coupon"}
          </DialogTitle>
          <DialogDescription>
            {coupon
              ? "Update the coupon details below"
              : "Create a new discount coupon for student enrollments"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                placeholder="e.g., SUMMER2025"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                disabled={isLoading}
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                Code will be automatically converted to uppercase
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="percentage">Discount Percentage</Label>
              <div className="relative">
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, percentage: parseInt(e.target.value) || 0 })
                  }
                  disabled={isLoading}
                  required
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a value between 0 and 100
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isactive">Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Only active coupons can be used
                </p>
              </div>
              <Switch
                id="isactive"
                checked={formData.isactive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isactive: checked })
                }
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {coupon ? "Update" : "Create"} Coupon
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
