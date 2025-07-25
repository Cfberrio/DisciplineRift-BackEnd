"use client"

import { useState, useEffect } from "react"
import type { ScheduleData } from "../api/types"
import { fetchScheduleData } from "../api/schedule-service"

export function useSchedule() {
  const [data, setData] = useState<ScheduleData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const scheduleData = await fetchScheduleData()
        setData(scheduleData)
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
      const scheduleData = await fetchScheduleData()
      setData(scheduleData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
    } finally {
      setIsLoading(false)
    }
  }

  return { data, isLoading, error, refetch }
}
