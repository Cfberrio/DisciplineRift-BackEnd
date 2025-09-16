"use client"

import { useEffect } from "react"
import { useStaff } from "@/contexts/staff-context"
import { useSchools } from "@/contexts/schools-context"
import { useServices } from "@/contexts/services-context"
import { useContextRefresh } from "@/hooks/use-context-refresh"

export function ConnectionManager() {
  const { fetchStaff } = useStaff()
  const { fetchSchools } = useSchools()
  const { refreshServices } = useServices()

  // Set up automatic refresh on activity after inactivity
  const { refreshAllContexts } = useContextRefresh({
    refreshFunctions: [
      fetchStaff,
      fetchSchools, 
      refreshServices,
    ],
    refreshOnActivity: true,
    inactivityThreshold: 25000, // 25 seconds
  })

  useEffect(() => {
    console.log('ConnectionManager: Activity-based refresh system initialized')
  }, [])

  // This component doesn't render anything, it just manages connections
  return null
}
