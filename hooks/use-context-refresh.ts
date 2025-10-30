"use client"

import { useCallback, useRef, useEffect } from "react"
import { useActivityDetection } from "./use-activity-detection"

interface RefreshFunction {
  (): Promise<void>
}

interface UseContextRefreshOptions {
  refreshFunctions: RefreshFunction[]
  refreshOnActivity?: boolean
  inactivityThreshold?: number
}

export function useContextRefresh({
  refreshFunctions,
  refreshOnActivity = true,
  inactivityThreshold = 60000, // 60 seconds - aumentado para evitar loops
}: UseContextRefreshOptions) {
  const isRefreshingRef = useRef<boolean>(false)
  const lastRefreshRef = useRef<number>(Date.now())
  const refreshCountRef = useRef<number>(0)
  const resetCountTimeoutRef = useRef<NodeJS.Timeout>()

  const refreshAllContexts = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log('Context refresh already in progress, skipping...')
      return
    }

    const timeSinceLastRefresh = Date.now() - lastRefreshRef.current
    if (timeSinceLastRefresh < 30000) { // Minimum 30 seconds between refreshes para evitar loops
      console.log('Context refresh too recent, skipping...')
      return
    }

    // Circuit breaker: prevent too many refreshes in a short period
    refreshCountRef.current += 1
    if (refreshCountRef.current > 1) { // Max 1 refresh por sesión de inactividad
      console.warn('Too many context refreshes detected, circuit breaker activated. Skipping...')
      return
    }

    // Reset counter after 30 seconds
    if (resetCountTimeoutRef.current) {
      clearTimeout(resetCountTimeoutRef.current)
    }
    resetCountTimeoutRef.current = setTimeout(() => {
      refreshCountRef.current = 0
      console.log('Context refresh circuit breaker reset')
    }, 30000)

    isRefreshingRef.current = true
    lastRefreshRef.current = Date.now()

    try {
      console.log(`Refreshing all contexts (attempt ${refreshCountRef.current}/3) due to activity after inactivity...`)
      
      // Execute all refresh functions in parallel with individual error handling
      await Promise.allSettled(
        refreshFunctions.map(async (refreshFn, index) => {
          try {
            await refreshFn()
            console.log(`Context ${index + 1} refreshed successfully`)
          } catch (error) {
            console.error(`Error refreshing context ${index + 1}:`, error)
          }
        })
      )
      
      console.log('All contexts refresh completed')
    } catch (error) {
      console.error('Error during context refresh:', error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [refreshFunctions])

  const handleInactivity = useCallback((duration: number) => {
    console.log(`User inactive for ${duration}ms - connections may need refresh on next activity`)
    // Don't refresh during inactivity, just prepare for next activity
  }, [])

  useActivityDetection({
    onActivity: refreshOnActivity ? refreshAllContexts : undefined,
    onInactive: handleInactivity,
    inactivityThreshold,
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (resetCountTimeoutRef.current) {
        clearTimeout(resetCountTimeoutRef.current)
      }
    }
  }, [])

  return {
    refreshAllContexts,
    isRefreshing: () => isRefreshingRef.current,
    getLastRefresh: () => lastRefreshRef.current,
  }
}
