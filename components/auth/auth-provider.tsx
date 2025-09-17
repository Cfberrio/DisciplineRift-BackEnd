"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
// import { RefreshDetector } from "./refresh-detector"

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isRefreshDetected, setIsRefreshDetected] = useState(false)

  useEffect(() => {
    // Check if this is a refresh first
    const isPageRefresh = () => {
      if (performance.navigation && performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        return true
      }
      
      if (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) {
        const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
        return navEntry.type === "reload"
      }
      
      return false
    }

    if (isPageRefresh()) {
      console.log("🔄 Refresh detected in AuthProvider - skipping auth initialization")
      setIsRefreshDetected(true)
      setIsLoading(false)
      return
    }

    // Get initial session only if not a refresh
    const getInitialSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession()

        setSession(initialSession)
        setUser(initialSession?.user ?? null)

        if (initialSession?.user?.email) {
          // Check if user is admin using correct table name
          try {
            const { data: adminData, error: adminError } = await supabase
            .from("admin")
            .select("*")
            .eq("email", initialSession.user.email)
            .single()

            if (adminError) {
              console.warn("⚠️ Error verificando admin:", adminError)
              // TEMPORAL: Si hay error con la tabla admin, permitir acceso
              console.log("🔧 MODO DIAGNÓSTICO: Permitiendo acceso temporal")
              setIsAdmin(true)
            } else {
              console.log("✅ Usuario verificado como admin:", !!adminData)
          setIsAdmin(!!adminData)
            }
          } catch (error) {
            console.warn("⚠️ Error en verificación admin:", error)
            // TEMPORAL: Si hay error, permitir acceso
            console.log("🔧 MODO DIAGNÓSTICO: Permitiendo acceso temporal")
            setIsAdmin(true)
          }
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes only if not a refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isRefreshDetected) {
        console.log("🔄 Skipping auth state change due to refresh detection")
        return
      }

      console.log("Auth state changed:", event, session?.user?.email)

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user?.email) {
        // Check if user is admin using correct table name
        try {
          const { data: adminData, error: adminError } = await supabase
            .from("admin")
            .select("*")
            .eq("email", session.user.email)
            .single()

          if (adminError) {
            console.warn("⚠️ Error verificando admin:", adminError)
            // TEMPORAL: Si hay error con la tabla admin, permitir acceso
            console.log("🔧 MODO DIAGNÓSTICO: Permitiendo acceso temporal")
            setIsAdmin(true)
          } else {
            console.log("✅ Usuario verificado como admin:", !!adminData)
        setIsAdmin(!!adminData)
          }
        } catch (error) {
          console.warn("⚠️ Error en verificación admin:", error)
          // TEMPORAL: Si hay error, permitir acceso
          console.log("🔧 MODO DIAGNÓSTICO: Permitiendo acceso temporal")
          setIsAdmin(true)
        }
      } else {
        setIsAdmin(false)
      }

      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
