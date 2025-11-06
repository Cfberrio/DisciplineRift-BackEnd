"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache for 30 seconds before considering data stale
            // This prevents infinite loops while ensuring fresh data
            staleTime: 30 * 1000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Do NOT refetch on window focus (prevents unnecessary refetches)
            refetchOnWindowFocus: false,
            // Refetch on mount if data is stale (controlled by staleTime)
            refetchOnMount: true,
            // Do NOT refetch on reconnect
            refetchOnReconnect: false,
            // Only retry once on error
            retry: 1,
            // Delay between retries
            retryDelay: 1000,
          },
          mutations: {
            // Only retry mutations once
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}


