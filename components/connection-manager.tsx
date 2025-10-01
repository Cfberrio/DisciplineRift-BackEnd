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
  // DESACTIVADO para evitar loops infinitos - los contexts se refrescan manualmente cuando es necesario
  const { refreshAllContexts } = useContextRefresh({
    refreshFunctions: [
      fetchStaff,
      fetchSchools, 
      refreshServices,
    ],
    refreshOnActivity: false, // DESACTIVADO para prevenir loops
    inactivityThreshold: 300000, // 5 minutos - mucho más largo
  })

  useEffect(() => {
    console.log('ConnectionManager: Manual refresh system initialized (auto-refresh disabled)')
  }, [])

  // This component doesn't render anything, it just manages connections
  return null
}
