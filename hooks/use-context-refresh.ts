"use client"

import { useCallback, useRef } from "react"
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
  inactivityThreshold = 25000, // 25 seconds
}: UseContextRefreshOptions) {
  const isRefreshingRef = useRef<boolean>(false)
  const lastRefreshRef = useRef<number>(Date.now())

  const refreshAllContexts = useCallback(async () => {
    if (isRefreshingRef.current) {
      console.log('Context refresh already in progress, skipping...')
      return
    }

    const timeSinceLastRefresh = Date.now() - lastRefreshRef.current
    if (timeSinceLastRefresh < 5000) { // Minimum 5 seconds between refreshes
      console.log('Context refresh too recent, skipping...')
      return
    }

    isRefreshingRef.current = true
    lastRefreshRef.current = Date.now()

    try {
      console.log('Refreshing all contexts due to activity after inactivity...')
      
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

  return {
    refreshAllContexts,
    isRefreshing: () => isRefreshingRef.current,
    getLastRefresh: () => lastRefreshRef.current,
  }
}
