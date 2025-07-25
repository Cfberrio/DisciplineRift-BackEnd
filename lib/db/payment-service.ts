import { createClient } from "../supabase/client"
import { createServerSupabaseClient } from "../supabase/server"

export type Payment = {
  paymentid: string
  date: string
  amount: number
  enrollmentid: string
}

// Client-side payment functions
export const paymentClient = {
  /**
   * Get all payments
   */
  async getAll(options?: { enrollmentId?: string }): Promise<Payment[]> {
    const supabase = createClient()
    let query = supabase.from("payment").select("*")

    if (options?.enrollmentId) {
      query = query.eq("enrollmentid", options.enrollmentId)
    }

    const { data, error } = await query.order("date", { ascending: false })

    if (error) {
      console.error("Error fetching payments:", error)
      return []
    }

    return data || []
  },

  /**
   * Get payment by ID
   */
  async getById(id: string): Promise<Payment | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from("payment").select("*").eq("paymentid", id).single()

    if (error) {
      console.error("Error fetching payment:", error)
      return null
    }

    return data
  },

  /**
   * Get payments by enrollment ID
   */
  async getByEnrollmentId(enrollmentId: string): Promise<Payment[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("payment")
      .select("*")
      .eq("enrollmentid", enrollmentId)
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching payments by enrollment:", error)
      return []
    }

    return data || []
  },
}

// Server-side payment functions
export const paymentServer = {
  /**
   * Get all payments
   */
  async getAll(options?: { enrollmentId?: string }): Promise<Payment[]> {
    const supabase = await createServerSupabaseClient()
    let query = supabase.from("payment").select("*")

    if (options?.enrollmentId) {
      query = query.eq("enrollmentid", options.enrollmentId)
    }

    const { data, error } = await query.order("date", { ascending: false })

    if (error) {
      console.error("Error fetching payments:", error)
      return []
    }

    return data || []
  },

  /**
   * Get payment by ID
   */
  async getById(id: string): Promise<Payment | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("payment").select("*").eq("paymentid", id).single()

    if (error) {
      console.error("Error fetching payment:", error)
      return null
    }

    return data
  },

  /**
   * Create new payment
   */
  async create(payment: Omit<Payment, "paymentid">): Promise<Payment | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("payment").insert([payment]).select().single()

    if (error) {
      console.error("Error creating payment:", error)
      return null
    }

    return data
  },

  /**
   * Update payment
   */
  async update(id: string, updates: Partial<Omit<Payment, "paymentid">>): Promise<Payment | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("payment").update(updates).eq("paymentid", id).select().single()

    if (error) {
      console.error("Error updating payment:", error)
      return null
    }

    return data
  },

  /**
   * Delete payment
   */
  async delete(id: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("payment").delete().eq("paymentid", id)

    if (error) {
      console.error("Error deleting payment:", error)
      return false
    }

    return true
  },
}
