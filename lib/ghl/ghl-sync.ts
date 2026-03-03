import { createServerSupabaseClient } from "@/lib/supabase/server"
import {
  upsertContact,
  rateLimitedDelay,
  normalizePhoneForGHL,
  verifyGHLConfiguration,
  GHL_CUSTOM_FIELD_IDS,
} from "./ghl-client"
import type {
  AggregatedParentData,
  GHLContactPayload,
  GHLCustomField,
  SyncResult,
  SyncSummary,
} from "./types"

const SOURCE_SYSTEM_VALUE = "DisciplineRift Dashboard"
const GLOBAL_TAGS = ["DisciplineRift", "Enrolled"] as const

interface EnrollmentRow {
  enrollmentid: string
  isactive: boolean
  teamid: string
  student: {
    studentid: string
    firstname: string
    lastname: string
    Level: number | null
    grade: string
    parentid: string
    parent: {
      parentid: string
      firstname: string
      lastname: string
      email: string
      phone: string
    }
  }
  team: {
    teamid: string
    name: string
    sport: string | null
    season: string | null
    schoolid: number
    school: {
      name: string
      location: string | null
    }
  }
}

async function fetchActiveEnrollments(): Promise<EnrollmentRow[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("enrollment")
    .select(
      `
      enrollmentid,
      isactive,
      teamid,
      student!inner (
        studentid,
        firstname,
        lastname,
        Level,
        grade,
        parentid,
        parent!inner (
          parentid,
          firstname,
          lastname,
          email,
          phone
        )
      ),
      team!inner (
        teamid,
        name,
        sport,
        season,
        schoolid,
        school:schoolid (
          name,
          location
        )
      )
    `
    )
    .eq("isactive", true)

  if (error) {
    console.error("[GHL Sync] Error fetching enrollments:", error)
    throw new Error(`Failed to fetch enrollments: ${error.message}`)
  }

  if (!data || data.length === 0) {
    console.log("[GHL Sync] No active enrollments found")
    return []
  }

  console.log(`[GHL Sync] Fetched ${data.length} active enrollments`)
  return data as unknown as EnrollmentRow[]
}

function aggregateByParent(
  enrollments: EnrollmentRow[]
): Map<string, AggregatedParentData> {
  const parentMap = new Map<string, AggregatedParentData>()

  for (const enrollment of enrollments) {
    const parent = enrollment.student.parent
    const student = enrollment.student
    const team = enrollment.team
    const school = team.school

    if (!parentMap.has(parent.parentid)) {
      parentMap.set(parent.parentid, {
        parentId: parent.parentid,
        firstName: parent.firstname,
        lastName: parent.lastname,
        email: parent.email,
        phone: parent.phone,
        studentNames: [],
        studentLevels: [],
        teamNames: [],
        schoolNames: [],
        seasons: [],
        sports: [],
      })
    }

    const aggregated = parentMap.get(parent.parentid)!
    const studentFullName = `${student.firstname} ${student.lastname}`

    if (!aggregated.studentNames.includes(studentFullName)) {
      aggregated.studentNames.push(studentFullName)
    }

    const studentLevel = student.Level != null ? String(student.Level) : "Not specified"
    if (!aggregated.studentLevels.includes(studentLevel)) {
      aggregated.studentLevels.push(studentLevel)
    }

    if (!aggregated.teamNames.includes(team.name)) {
      aggregated.teamNames.push(team.name)
    }

    const schoolName = school?.name || "Unknown School"
    if (!aggregated.schoolNames.includes(schoolName)) {
      aggregated.schoolNames.push(schoolName)
    }

    if (team.season && !aggregated.seasons.includes(team.season)) {
      aggregated.seasons.push(team.season)
    }

    const sport = team.sport || "Volleyball"
    if (!aggregated.sports.includes(sport)) {
      aggregated.sports.push(sport)
    }
  }

  return parentMap
}

function buildCustomFields(
  aggregated: AggregatedParentData
): GHLCustomField[] {
  return [
    {
      id: GHL_CUSTOM_FIELD_IDS.STUDENT_NAMES,
      field_value: aggregated.studentNames.join(", "),
    },
    {
      id: GHL_CUSTOM_FIELD_IDS.STUDENT_LEVELS,
      field_value: aggregated.studentLevels.join(", "),
    },
    {
      id: GHL_CUSTOM_FIELD_IDS.TEAM_NAMES,
      field_value: aggregated.teamNames.join(", "),
    },
    {
      id: GHL_CUSTOM_FIELD_IDS.SCHOOL_NAMES,
      field_value: aggregated.schoolNames.join(", "),
    },
    {
      id: GHL_CUSTOM_FIELD_IDS.ENROLLMENT_STATUS,
      field_value: "Active",
    },
    {
      id: GHL_CUSTOM_FIELD_IDS.LAST_SYNC,
      field_value: new Date().toISOString(),
    },
    {
      id: GHL_CUSTOM_FIELD_IDS.SOURCE_SYSTEM,
      field_value: SOURCE_SYSTEM_VALUE,
    },
    {
      id: GHL_CUSTOM_FIELD_IDS.SEASON,
      field_value: aggregated.seasons.join(", ") || "Not assigned",
    },
    {
      id: GHL_CUSTOM_FIELD_IDS.SPORT,
      field_value: aggregated.sports.join(", ") || "Not assigned",
    },
  ]
}

function buildTags(aggregated: AggregatedParentData): string[] {
  const tags: string[] = [...GLOBAL_TAGS]

  for (const season of aggregated.seasons) {
    tags.push(season)
  }

  for (const sport of aggregated.sports) {
    tags.push(sport)
  }

  for (const teamName of aggregated.teamNames) {
    tags.push(`Team: ${teamName}`)
  }

  for (const schoolName of aggregated.schoolNames) {
    tags.push(`School: ${schoolName}`)
  }

  return tags
}

function buildContactPayload(
  aggregated: AggregatedParentData
): GHLContactPayload {
  const locationId = process.env.GHL_LOCATION_ID
  if (!locationId) {
    throw new Error("GHL_LOCATION_ID environment variable is not set")
  }

  const payload: GHLContactPayload = {
    firstName: aggregated.firstName,
    lastName: aggregated.lastName,
    locationId,
    tags: buildTags(aggregated),
    customFields: buildCustomFields(aggregated),
    source: SOURCE_SYSTEM_VALUE,
  }

  if (aggregated.email) {
    payload.email = aggregated.email
  }

  if (aggregated.phone) {
    payload.phone = normalizePhoneForGHL(aggregated.phone)
  }

  return payload
}

const DEFAULT_BATCH_LIMIT = 50

export async function syncContactsToGHL(
  offset: number = 0,
  limit: number = DEFAULT_BATCH_LIMIT
): Promise<SyncSummary> {
  const startedAt = new Date()
  const details: SyncResult[] = []
  let synced = 0
  let failed = 0
  let skipped = 0
  let newContacts = 0
  let updatedContacts = 0

  console.log(`[GHL Sync] Starting batch sync (offset=${offset}, limit=${limit})...`)

  const configCheck = verifyGHLConfiguration()
  if (!configCheck.isValid) {
    throw new Error(
      `GHL configuration invalid. Missing: ${configCheck.missingVars.join(", ")}`
    )
  }

  const enrollments = await fetchActiveEnrollments()

  if (enrollments.length === 0) {
    const completedAt = new Date()
    return {
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - startedAt.getTime(),
      total: 0,
      synced: 0,
      failed: 0,
      skipped: 0,
      newContacts: 0,
      updatedContacts: 0,
      batchOffset: offset,
      batchLimit: limit,
      hasMore: false,
      nextOffset: 0,
      details: [],
    }
  }

  const parentMap = aggregateByParent(enrollments)
  const allParents = Array.from(parentMap.values())
  const totalParents = allParents.length

  const batchParents = allParents.slice(offset, offset + limit)
  const hasMore = offset + limit < totalParents
  const nextOffset = hasMore ? offset + limit : totalParents

  console.log(
    `[GHL Sync] Total: ${totalParents} parents | Batch: ${offset}-${offset + batchParents.length} (${batchParents.length} in this batch) | Remaining: ${hasMore ? totalParents - nextOffset : 0}`
  )

  let processedCount = 0

  for (const aggregated of batchParents) {
    processedCount++
    const globalIndex = offset + processedCount

    if (!aggregated.email && !aggregated.phone) {
      console.warn(
        `[GHL Sync] Skipping parent ${aggregated.parentId} (${aggregated.firstName} ${aggregated.lastName}): no email or phone`
      )
      skipped++
      details.push({
        parentId: aggregated.parentId,
        parentName: `${aggregated.firstName} ${aggregated.lastName}`,
        email: aggregated.email,
        phone: aggregated.phone,
        success: false,
        error: "No email or phone available",
        tagsApplied: [],
      })
      continue
    }

    try {
      const payload = buildContactPayload(aggregated)

      console.log(
        `[GHL Sync] [${globalIndex}/${totalParents}] Upserting: ${aggregated.firstName} ${aggregated.lastName} (${aggregated.email})`
      )

      const result = await upsertContact(payload)

      if (result.success && result.data) {
        synced++
        if (result.data.new) {
          newContacts++
        } else {
          updatedContacts++
        }

        details.push({
          parentId: aggregated.parentId,
          parentName: `${aggregated.firstName} ${aggregated.lastName}`,
          email: aggregated.email,
          phone: aggregated.phone,
          success: true,
          ghlContactId: result.data.contact.id,
          isNewContact: result.data.new,
          tagsApplied: payload.tags,
        })
      } else {
        failed++
        details.push({
          parentId: aggregated.parentId,
          parentName: `${aggregated.firstName} ${aggregated.lastName}`,
          email: aggregated.email,
          phone: aggregated.phone,
          success: false,
          error: result.error || "Unknown upsert error",
          tagsApplied: [],
        })
      }
    } catch (contactError) {
      failed++
      const errorMessage =
        contactError instanceof Error
          ? contactError.message
          : "Unexpected error"

      console.error(
        `[GHL Sync] Error syncing parent ${aggregated.parentId}:`,
        errorMessage
      )

      details.push({
        parentId: aggregated.parentId,
        parentName: `${aggregated.firstName} ${aggregated.lastName}`,
        email: aggregated.email,
        phone: aggregated.phone,
        success: false,
        error: errorMessage,
        tagsApplied: [],
      })
    }

    if (processedCount < batchParents.length) {
      await rateLimitedDelay()
    }
  }

  const completedAt = new Date()

  const summary: SyncSummary = {
    startedAt: startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs: completedAt.getTime() - startedAt.getTime(),
    total: totalParents,
    synced,
    failed,
    skipped,
    newContacts,
    updatedContacts,
    batchOffset: offset,
    batchLimit: limit,
    hasMore,
    nextOffset,
    details,
  }

  console.log("[GHL Sync] Batch completed:", {
    total: totalParents,
    batchOffset: offset,
    batchLimit: limit,
    synced,
    failed,
    skipped,
    newContacts,
    updatedContacts,
    hasMore,
    nextOffset,
    durationMs: summary.durationMs,
  })

  return summary
}
