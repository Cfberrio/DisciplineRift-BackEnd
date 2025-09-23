import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    // Validate required fields
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Invalid email format" }, { status: 400 })
    }

    console.log("🔄 Sending password reset email to:", email)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) {
      console.error("❌ Password reset error:", error)
      return NextResponse.json({ message: "Failed to send reset email" }, { status: 500 })
    }

    console.log("✅ Password reset email sent successfully")

    return NextResponse.json({
      message: "If an account with that email exists, we've sent you a password reset link.",
    })
  } catch (error) {
    console.error("❌ Forgot password error:", error)
    return NextResponse.json({ message: "An unexpected error occurred" }, { status: 500 })
  }
}
