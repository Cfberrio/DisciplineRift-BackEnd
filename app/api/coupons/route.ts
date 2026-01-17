import { NextResponse } from "next/server"
import { couponClient } from "@/lib/db/coupon-service"

export const dynamic = "force-dynamic"

// GET /api/coupons - Get all coupons
export async function GET() {
  try {
    const coupons = await couponClient.getAll()
    return NextResponse.json(coupons)
  } catch (error: any) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch coupons" },
      { status: 500 }
    )
  }
}

// POST /api/coupons - Create a new coupon
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, percentage, isactive } = body

    // Validation
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required and must be a string" },
        { status: 400 }
      )
    }

    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      return NextResponse.json(
        { error: "Percentage must be a number between 0 and 100" },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existingCoupon = await couponClient.getByCode(code)
    if (existingCoupon) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      )
    }

    const coupon = await couponClient.create({
      code,
      percentage,
      isactive: isactive !== undefined ? isactive : true,
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error: any) {
    console.error("Error creating coupon:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create coupon" },
      { status: 500 }
    )
  }
}
