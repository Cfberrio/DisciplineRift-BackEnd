export interface GHLCustomField {
  key: string
  field_value: string
}

export interface GHLContactPayload {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  locationId: string
  tags: string[]
  customFields: GHLCustomField[]
  source: string
}

export interface GHLUpsertResponse {
  contact: {
    id: string
    locationId: string
    firstName: string
    lastName: string
    email: string
    phone: string
    tags: string[]
  }
  new: boolean
}

export interface SyncResult {
  parentId: string
  parentName: string
  email: string
  phone: string
  success: boolean
  ghlContactId?: string
  isNewContact?: boolean
  error?: string
  tagsApplied: string[]
}

export interface SyncSummary {
  startedAt: string
  completedAt: string
  durationMs: number
  total: number
  synced: number
  failed: number
  skipped: number
  newContacts: number
  updatedContacts: number
  batchOffset: number
  batchLimit: number
  hasMore: boolean
  nextOffset: number
  details: SyncResult[]
}

export interface AggregatedParentData {
  parentId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  studentNames: string[]
  studentLevels: string[]
  teamNames: string[]
  schoolNames: string[]
  seasons: string[]
  sports: string[]
}
