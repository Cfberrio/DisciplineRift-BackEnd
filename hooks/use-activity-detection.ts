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
  inactivityThreshold = 25000, // 25 seconds
}: UseActivityDetectionOptions = {}) {
  const lastActivityRef = useRef<number>(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout>()
  const isInactiveRef = useRef<boolean>(false)
  const isInitializedRef = useRef<boolean>(false)

  const updateActivity = useCallback(() => {
    const now = Date.now()
    const wasInactive = isInactiveRef.current
    
    lastActivityRef.current = now
    isInactiveRef.current = false

    // Only trigger onActivity if we were actually inactive AND it's not the initial mount
    if (wasInactive && onActivity && isInitializedRef.current) {
      console.log('User activity detected after inactivity, refreshing connections...')
      onActivity()
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
    // Activity events to monitor
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus',
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
    }, 2000) // Wait 2 seconds before considering real activity

    return () => {
      clearTimeout(initTimeout)
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
