"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

export function RefreshDetector() {
  const router = useRouter()
  const hasDetectedRefresh = useRef(false)

  useEffect(() => {
    // Detect if this is a page refresh
    const isPageRefresh = () => {
      // Check if the page was loaded via refresh
      if (performance.navigation && performance.navigation.type === performance.navigation.TYPE_RELOAD) {
        return true
      }
      
      // Alternative method for newer browsers
      if (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) {
        const navEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
        return navEntry.type === "reload"
      }
      
      return false
    }

    const handleRefreshDetection = async () => {
      if (hasDetectedRefresh.current) return
      
      const isRefresh = isPageRefresh()
      
      if (isRefresh) {
        console.log("🔄 Page refresh detected - clearing session and redirecting to login")
        hasDetectedRefresh.current = true
        
        try {
          // Clear Supabase session
          await supabase.auth.signOut()
          
          // Clear all cookies
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=")
            const name = eqPos > -1 ? c.substr(0, eqPos) : c
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
          })
          
          // Clear localStorage and sessionStorage
          localStorage.clear()
          sessionStorage.clear()
          
          // Clear any Supabase storage
          if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') || key.includes('supabase')) {
                localStorage.removeItem(key)
              }
            })
          }
          
          console.log("✅ Session cleared successfully")
          
          // Redirect to login with a small delay to ensure cleanup
          setTimeout(() => {
            router.push('/login')
          }, 100)
          
        } catch (error) {
          console.error("❌ Error clearing session:", error)
          // Still redirect to login even if cleanup fails
          router.push('/login')
        }
      }
    }

    // Run detection immediately
    handleRefreshDetection()

    // Also run on window focus (backup detection)
    const handleFocus = () => {
      if (!hasDetectedRefresh.current) {
        handleRefreshDetection()
      }
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [router])

  // This component doesn't render anything
  return null
}
