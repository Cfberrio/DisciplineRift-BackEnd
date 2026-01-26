"use client"

import { useQuery } from "@tanstack/react-query"
import type { TodaySessionsData } from "@/lib/api/types"

async function fetchTodaySessions(): Promise<TodaySessionsData> {
  const response = await fetch("/api/sessions-today")
  
  if (!response.ok) {
    throw new Error("Failed to fetch today's sessions")
  }
  
  return await response.json()
}

export function useTodaySessions() {
  return useQuery({
    queryKey: ["today-sessions"],
    queryFn: fetchTodaySessions,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}
