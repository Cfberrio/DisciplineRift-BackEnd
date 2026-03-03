import type { GHLContactPayload, GHLUpsertResponse } from "./types"

const GHL_API_BASE = "https://services.leadconnectorhq.com"
const GHL_API_VERSION = "2021-07-28"
const MAX_RETRIES = 3
const RATE_LIMIT_DELAY_MS = 700
const INITIAL_RETRY_DELAY_MS = 1000

export const GHL_CUSTOM_FIELD_KEYS = {
  STUDENT_NAMES: "contact.student_names",
  STUDENT_LEVELS: "contact.student_levels",
  TEAM_NAMES: "contact.team_names",
  SCHOOL_NAMES: "contact.school_names",
  ENROLLMENT_STATUS: "contact.enrollment_status",
  LAST_SYNC: "contact.last_sync",
  SOURCE_SYSTEM: "contact.source_system",
} as const

function getGHLHeaders(): Record<string, string> {
  const apiKey = process.env.GHL_API_KEY
  if (!apiKey) {
    throw new Error("GHL_API_KEY environment variable is not set")
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    Version: GHL_API_VERSION,
  }
}

export function normalizePhoneForGHL(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, "")

  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      cleaned = "+" + cleaned
    } else if (cleaned.length === 10) {
      cleaned = "+1" + cleaned
    } else {
      cleaned = "+1" + cleaned.replace(/^1/, "")
    }
  }

  return cleaned
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function upsertContact(
  payload: GHLContactPayload
): Promise<{ success: boolean; data?: GHLUpsertResponse; error?: string }> {
  let lastError = ""

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
        method: "POST",
        headers: getGHLHeaders(),
        body: JSON.stringify(payload),
      })

      if (response.status === 429) {
        const retryAfterMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        console.warn(
          `[GHL] Rate limited (429). Retry ${attempt}/${MAX_RETRIES} in ${retryAfterMs}ms`
        )
        await delay(retryAfterMs)
        continue
      }

      if (response.status >= 500) {
        const retryAfterMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        console.warn(
          `[GHL] Server error (${response.status}). Retry ${attempt}/${MAX_RETRIES} in ${retryAfterMs}ms`
        )
        await delay(retryAfterMs)
        lastError = `Server error: ${response.status}`
        continue
      }

      if (!response.ok) {
        const errorBody = await response.text()
        console.error(`[GHL] Upsert failed (${response.status}):`, errorBody)
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorBody}`,
        }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (networkError) {
      lastError =
        networkError instanceof Error
          ? networkError.message
          : "Network error"
      console.error(
        `[GHL] Network error on attempt ${attempt}/${MAX_RETRIES}:`,
        lastError
      )

      if (attempt < MAX_RETRIES) {
        const retryAfterMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        await delay(retryAfterMs)
      }
    }
  }

  return { success: false, error: `All ${MAX_RETRIES} retries exhausted. Last error: ${lastError}` }
}

export async function rateLimitedDelay(): Promise<void> {
  await delay(RATE_LIMIT_DELAY_MS)
}

export function verifyGHLConfiguration(): {
  isValid: boolean
  missingVars: string[]
} {
  const requiredVars = ["GHL_API_KEY", "GHL_LOCATION_ID"]
  const missingVars = requiredVars.filter((v) => !process.env[v])

  return {
    isValid: missingVars.length === 0,
    missingVars,
  }
}
