import type { ActivityData } from "./types"

// Fetch activity data from the API
export async function fetchActivityData(): Promise<ActivityData> {
  try {
    const response = await fetch("/api/activities")

    if (!response.ok) {
      throw new Error("Failed to fetch activity data")
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching activity data:", error)
    throw error
  }
}
