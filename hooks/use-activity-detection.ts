"use client"

import { useEffect, useRef, useCallback } from "react"

interface UseActivityDetectionOptions {
  onActivity?: () => void
  onInactive?: (duration: number) => void
  inactivityThreshold?: number // milliseconds
}

export function useActivityDetection({
  onActivity,
  onInactive,
  inactivityThreshold = 60000, // 60 seconds - aumentado para evitar loops
}: UseActivityDetectionOptions = {}) {
  const lastActivityRef = useRef<number>(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isInactiveRef = useRef<boolean>(false)
  const isInitializedRef = useRef<boolean>(false)
  const lastActivityTriggerRef = useRef<number>(0) // Track when we last triggered onActivity
  const activityCountRef = useRef<number>(0) // Count activities to avoid spam

  const updateActivity = useCallback(() => {
    const now = Date.now()
    const wasInactive = isInactiveRef.current
    
    lastActivityRef.current = now
    isInactiveRef.current = false

    // More restrictive conditions for triggering onActivity
    const timeSinceLastTrigger = now - lastActivityTriggerRef.current
    const shouldTriggerActivity = wasInactive && 
                                 onActivity && 
                                 isInitializedRef.current &&
                                 timeSinceLastTrigger > 60000 // Minimum 60 seconds between activity triggers

    if (shouldTriggerActivity) {
      // Additional spam protection: limit activity triggers
      activityCountRef.current += 1
      if (activityCountRef.current <= 1) { // Max 1 activity trigger per session para prevenir loops
        console.log('User activity detected after significant inactivity, refreshing connections...')
        lastActivityTriggerRef.current = now
        onActivity()
      } else {
        console.log('Activity trigger limit reached, skipping refresh to prevent loops')
      }
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      const inactiveDuration = Date.now() - lastActivityRef.current
      if (inactiveDuration >= inactivityThreshold) {
        isInactiveRef.current = true
        console.log(`User inactive for ${inactiveDuration}ms, connections may be stale`)
        onInactive?.(inactiveDuration)
      }
    }, inactivityThreshold)
  }, [onActivity, onInactive, inactivityThreshold])

  useEffect(() => {
    // Activity events to monitor - removido mousemove y scroll para evitar triggers excesivos
    const events = [
      'mousedown',
      'keypress',
      'touchstart',
      'click',
    ]

    // Throttle activity updates to avoid excessive calls
    let throttleTimeout: NodeJS.Timeout | null = null
    const throttledUpdateActivity = () => {
      if (throttleTimeout) return
      
      throttleTimeout = setTimeout(() => {
        updateActivity()
        throttleTimeout = null
      }, 1000) // Throttle to once per second
    }

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, throttledUpdateActivity, { passive: true })
    })

    // Initialize activity - mark as initialized after a delay to prevent immediate triggers
    updateActivity()
    
    // Set initialized flag after initial setup to prevent refresh on mount
    const initTimeout = setTimeout(() => {
      isInitializedRef.current = true
      console.log('Activity detection initialized - ready to detect activity after inactivity')
    }, 5000) // Wait 5 seconds before considering real activity (increased from 2s)

    // Reset activity counter after prolonged inactivity to allow refreshes again
    const resetCounterInterval = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current
      if (timeSinceLastActivity > 600000) { // 10 minutes of inactivity (aumentado de 5 min)
        activityCountRef.current = 0
        console.log('Activity counter reset after prolonged inactivity')
      }
    }, 120000) // Check every 2 minutes (reducido de 1 min para menos overhead)

    return () => {
      clearTimeout(initTimeout)
      clearInterval(resetCounterInterval)
      // Cleanup
      events.forEach(event => {
        document.removeEventListener(event, throttledUpdateActivity)
      })
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      if (throttleTimeout) {
        clearTimeout(throttleTimeout)
      }
    }
  }, [updateActivity])

  return {
    getLastActivity: () => lastActivityRef.current,
    getInactiveDuration: () => Date.now() - lastActivityRef.current,
    isInactive: () => isInactiveRef.current,
    forceActivity: updateActivity,
  }
}
