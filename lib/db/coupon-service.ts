import { supabase } from "../supabase/client"

export type Coupon = {
  couponid: string
  code: string
  percentage: number
  isactive: boolean
  created_at: string
}

export type CreateCouponInput = {
  code: string
  percentage: number
  isactive?: boolean
}

export type UpdateCouponInput = {
  code?: string
  percentage?: number
  isactive?: boolean
}

// Client-side coupon functions
export const couponClient = {
  /**
   * Get all coupons
   */
  async getAll(): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from("coupon")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("couponClient.getAll - Error:", error)
      throw error
    }
    
    console.log("couponClient.getAll - Retrieved coupons:", data?.length || 0)
    if (data && data.length > 0) {
      console.log("couponClient.getAll - First coupon:", data[0])
    }
    
    return data || []
  },

  /**
   * Get a single coupon by ID
   */
  async getById(couponid: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from("coupon")
      .select("*")
      .eq("couponid", couponid)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get a coupon by code
   */
  async getByCode(code: string): Promise<Coupon | null> {
    const { data, error } = await supabase
      .from("coupon")
      .select("*")
      .eq("code", code.toUpperCase())
      .single()

    if (error) {
      if (error.code === "PGRST116") return null // Not found
      throw error
    }
    return data
  },

  /**
   * Create a new coupon
   */
  async create(input: CreateCouponInput): Promise<Coupon> {
    // Ensure code is uppercase
    const couponData = {
      code: input.code.toUpperCase(),
      percentage: input.percentage,
      isactive: input.isactive !== undefined ? input.isactive : true,
    }

    const { data, error } = await supabase
      .from("coupon")
      .insert([couponData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a coupon
   */
  async update(couponid: string, input: UpdateCouponInput): Promise<Coupon> {
    const updateData: any = {}
    if (input.code !== undefined) updateData.code = input.code.toUpperCase()
    if (input.percentage !== undefined) updateData.percentage = input.percentage
    if (input.isactive !== undefined) updateData.isactive = input.isactive

    const { data, error } = await supabase
      .from("coupon")
      .update(updateData)
      .eq("couponid", couponid)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a coupon
   */
  async delete(couponid: string): Promise<void> {
    console.log("couponClient.delete - Deleting coupon with ID:", couponid)
    
    const { error } = await supabase
      .from("coupon")
      .delete()
      .eq("couponid", couponid)

    if (error) {
      console.error("couponClient.delete - Error:", error)
      throw error
    }
    
    console.log("couponClient.delete - Successfully deleted coupon:", couponid)
  },

  /**
   * Toggle coupon active status
   */
  async toggleActive(couponid: string, isactive: boolean): Promise<Coupon> {
    return this.update(couponid, { isactive })
  },
}
