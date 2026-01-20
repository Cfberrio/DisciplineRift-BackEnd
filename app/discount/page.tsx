"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CouponTable } from "@/features/discount/coupon-table"
import type { Coupon } from "@/lib/db/coupon-service"

export default function DiscountPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchCoupons = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/coupons")
      
      if (!response.ok) {
        throw new Error("Failed to fetch coupons")
      }

      const data = await response.json()
      console.log("DiscountPage - Fetched coupons:", data)
      console.log("DiscountPage - First coupon structure:", data[0])
      setCoupons(data)
    } catch (error) {
      console.error("Error fetching coupons:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div className="container mx-auto px-6 py-8">
              <CouponTable
                coupons={coupons}
                isLoading={isLoading}
                onRefresh={fetchCoupons}
              />
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
