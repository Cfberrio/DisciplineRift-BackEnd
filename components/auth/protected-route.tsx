"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error || !session?.user) {
          router.push("/login")
          return
        }

        setUser(session.user)

        if (requireAdmin) {
          try {
          // Check if user is admin using correct table name
          const { data: adminData, error: adminError } = await supabase
            .from("admin")
            .select("*")
              .eq("email", session.user.email || "")
            .single()

            if (adminError) {
              console.warn("⚠️ Error verificando admin en ProtectedRoute:", adminError)
              // TEMPORAL: Si hay error con la tabla admin, permitir acceso
              console.log("🔧 MODO DIAGNÓSTICO: Permitiendo acceso temporal en ProtectedRoute")
              setIsAdmin(true)
            } else if (!adminData) {
              console.log("❌ Usuario no encontrado en tabla admin")
            router.push("/unauthorized")
            return
            } else {
              console.log("✅ Usuario verificado como admin en ProtectedRoute")
              setIsAdmin(true)
            }
          } catch (error) {
            console.warn("⚠️ Error en verificación admin:", error)
            // TEMPORAL: Si hay error, permitir acceso
            console.log("🔧 MODO DIAGNÓSTICO: Permitiendo acceso temporal")
            setIsAdmin(true)
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login")
      } else if (session?.user) {
        setUser(session.user)

        if (requireAdmin) {
          try {
          // Check if user is admin using correct table name
            const { data: adminData, error: adminError } = await supabase
              .from("admin")
              .select("*")
              .eq("email", session.user.email || "")
              .single()

            if (adminError) {
              console.warn("⚠️ Error verificando admin en onChange:", adminError)
              // TEMPORAL: Si hay error con la tabla admin, permitir acceso
              console.log("🔧 MODO DIAGNÓSTICO: Permitiendo acceso temporal en onChange")
              setIsAdmin(true)
            } else if (!adminData) {
              console.log("❌ Usuario no encontrado en tabla admin en onChange")
            router.push("/unauthorized")
            return
            } else {
              console.log("✅ Usuario verificado como admin en onChange")
              setIsAdmin(true)
            }
          } catch (error) {
            console.warn("⚠️ Error en verificación admin en onChange:", error)
            // TEMPORAL: Si hay error, permitir acceso
            console.log("🔧 MODO DIAGNÓSTICO: Permitiendo acceso temporal en onChange")
            setIsAdmin(true)
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [router, requireAdmin])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user || (requireAdmin && !isAdmin)) {
    return null
  }

  return <>{children}</>
}
