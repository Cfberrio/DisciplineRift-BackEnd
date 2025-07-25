"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function signInWithEmail(email: string, password: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Sign in error:", error)
    return { error: error.message }
  }

  console.log("User signed in successfully:", data.user?.email)
  redirect("/")
}

export async function signOut() {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Sign out error:", error)
    return { error: error.message }
  }

  redirect("/login")
}

export async function checkAuth() {
  const supabase = createServerSupabaseClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.user) {
      redirect("/login")
    }

    // Check if user is admin using correct table name
    const { data: adminData, error: adminError } = await supabase
      .from("admin")
      .select("*")
      .eq("email", session.user.email)
      .single()

    if (adminError && adminError.code !== "PGRST116") {
      console.error("[AUTH_ACTIONS] Error checking admin status:", adminError)
      redirect("/login")
    }

    if (!adminData) {
      console.log("[AUTH_ACTIONS] User is not admin")
      redirect("/login")
    }

    return {
      user: session.user,
      isAdmin: true,
    }
  } catch (error) {
    console.error("[AUTH_ACTIONS] Unexpected error:", error)
    redirect("/login")
  }
}

export async function checkAdmin() {
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    redirect("/login")
  }

  // Check if user is an admin using correct table name
  const { data: adminData, error: adminError } = await supabase
    .from("admin")
    .select("*")
    .eq("email", session.user.email || "")
    .single()

  if (adminError || !adminData) {
    redirect("/unauthorized")
  }

  return {
    id: session.user.id,
    email: session.user.email,
    user: session.user,
    session,
    isAdmin: true,
    adminData,
  }
}
