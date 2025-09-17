"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export function RefreshDetector() {
  const router = useRouter()
  const hasDetectedRefresh = useRef(false)

  useEffect(() => {
    const handleRefreshDetection = async () => {
      if (hasDetectedRefresh.current) return
      
      // More aggressive refresh detection
      const isRefresh = () => {
        // Check multiple indicators of refresh
        if (performance.navigation && performance.navigation.type === performance.navigation.TYPE_RELOAD) {
          return true
        }
        
        if (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) {
          const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
          return navEntry.type === "reload"
        }
        
        // Check if we have a session but the page was just loaded
        const hasSession = document.cookie.includes('sb-') || localStorage.getItem('supabase')
        const justLoaded = performance.now() < 1000 // Page loaded less than 1 second ago
        
        return hasSession && justLoaded
      }
      
      const isRefreshDetected = isRefresh()
      
      if (isRefreshDetected) {
        console.log("🔄 Page refresh detected - clearing session and redirecting to login")
        hasDetectedRefresh.current = true
        
        try {
          // Immediately redirect to prevent any other execution
          window.location.href = '/login'
          
          // Clear Supabase session in background
          await supabase.auth.signOut()
          
          // Clear all cookies aggressively
          const cookies = document.cookie.split(";")
          for (let cookie of cookies) {
            const eqPos = cookie.indexOf("=")
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
            if (name) {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
            }
          }
          
          // Clear all storage
          localStorage.clear()
          sessionStorage.clear()
          
          console.log("✅ Session cleared successfully")
          
        } catch (error) {
          console.error("❌ Error clearing session:", error)
          // Force redirect even if cleanup fails
          window.location.href = '/login'
        }
      }
    }

    // Run detection immediately and aggressively
    handleRefreshDetection()

    // Also check periodically for the first few seconds
    const interval = setInterval(() => {
      if (!hasDetectedRefresh.current) {
        handleRefreshDetection()
      } else {
        clearInterval(interval)
      }
    }, 100)

    // Clear interval after 3 seconds
    setTimeout(() => {
      clearInterval(interval)
    }, 3000)

    return () => {
      clearInterval(interval)
    }
  }, [router])

  // This component doesn't render anything
  return null
}
