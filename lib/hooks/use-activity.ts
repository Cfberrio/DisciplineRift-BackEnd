"use client"

import { useState, useEffect } from "react"
import type { ActivityData } from "../api/types"
import { fetchActivityData } from "../api/activity-service"

export function useActivity() {
  const [data, setData] = useState<ActivityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const activityData = await fetchActivityData()
        setData(activityData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const refetch = async () => {
    try {
      setIsLoading(true)
      const activityData = await fetchActivityData()
      setData(activityData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  return { data, isLoading, error, refetch }
}
