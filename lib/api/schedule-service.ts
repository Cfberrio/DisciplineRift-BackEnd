import type { ScheduleData } from "./types"

// Fetch schedule data from the API
export async function fetchScheduleData(): Promise<ScheduleData> {
  try {
    const response = await fetch("/api/schedule")

    if (!response.ok) {
      throw new Error("Failed to fetch schedule data")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching schedule data:", error)
    throw error
  }
}
