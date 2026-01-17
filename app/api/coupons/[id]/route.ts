import { NextResponse } from "next/server"
import { couponClient } from "@/lib/db/coupon-service"

export const dynamic = "force-dynamic"

// GET /api/coupons/[id] - Get a single coupon
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const coupon = await couponClient.getById(params.id)
    
    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(coupon)
  } catch (error: any) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch coupon" },
      { status: 500 }
    )
  }
}

// PATCH /api/coupons/[id] - Update a coupon
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { code, percentage, isactive } = body

    // Validation
    if (code !== undefined && typeof code !== "string") {
      return NextResponse.json(
        { error: "Code must be a string" },
        { status: 400 }
      )
    }

    if (percentage !== undefined && (typeof percentage !== "number" || percentage < 0 || percentage > 100)) {
      return NextResponse.json(
        { error: "Percentage must be a number between 0 and 100" },
        { status: 400 }
      )
    }

    // If updating code, check if it already exists
    if (code) {
      const existingCoupon = await couponClient.getByCode(code)
      if (existingCoupon && existingCoupon.couponid !== params.id) {
        return NextResponse.json(
          { error: "A coupon with this code already exists" },
          { status: 409 }
        )
      }
    }

    const updatedCoupon = await couponClient.update(params.id, {
      code,
      percentage,
      isactive,
    })

    return NextResponse.json(updatedCoupon)
  } catch (error: any) {
    console.error("Error updating coupon:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update coupon" },
      { status: 500 }
    )
  }
}

// DELETE /api/coupons/[id] - Delete a coupon
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await couponClient.delete(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete coupon" },
      { status: 500 }
    )
  }
}
