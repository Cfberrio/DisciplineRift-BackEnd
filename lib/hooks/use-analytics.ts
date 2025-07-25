"use client"

import { useState, useEffect } from "react"
import type { AnalyticsData } from "../api/types"
import { fetchAnalyticsData } from "../api/analytics-service"

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const analyticsData = await fetchAnalyticsData()
        setData(analyticsData)
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
      const analyticsData = await fetchAnalyticsData()
      setData(analyticsData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  return { data, isLoading, error, refetch }
}
