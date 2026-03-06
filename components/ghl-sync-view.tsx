"use client"

import { useState, useCallback, useRef } from "react"
import { RefreshCw, Zap, Database, CheckCircle2, XCircle, AlertCircle, Clock, Users, UserPlus, UserCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { supabase } from "@/lib/supabase/client"
import type { SyncSummary } from "@/lib/ghl/types"

const FULL_SYNC_BATCH_SIZE = 50

interface BatchProgress {
  currentBatch: number
  totalBatches: number | null
  processedContacts: number
  totalContacts: number | null
}

interface SyncState {
  isRunning: boolean
  mode: "incremental" | "full" | null
  error: string | null
  summary: SyncSummary | null
  batchProgress: BatchProgress | null
  aborted: boolean
}

const INITIAL_STATE: SyncState = {
  isRunning: false,
  mode: null,
  error: null,
  summary: null,
  batchProgress: null,
  aborted: false,
}

async function getAccessToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session?.access_token) {
    throw new Error("No active session. Please sign in again.")
  }
  return session.access_token
}

async function callManualSync(
  token: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; summary: SyncSummary }> {
  const response = await fetch("/api/ghl/manual-sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`)
  }

  return response.json()
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

function StatCard({ icon: Icon, label, value, variant = "default" }: {
  icon: React.ElementType
  label: string
  value: string | number
  variant?: "default" | "success" | "error" | "warning"
}) {
  const variantStyles = {
    default: "bg-gray-50 border-gray-200 text-gray-700",
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
  }

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${variantStyles[variant]}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs font-medium uppercase tracking-wide">{label}</div>
      </div>
    </div>
  )
}

export function GHLSyncView() {
  const [state, setState] = useState<SyncState>(INITIAL_STATE)
  const abortRef = useRef(false)

  const runIncrementalSync = useCallback(async () => {
    setState({ ...INITIAL_STATE, isRunning: true, mode: "incremental" })
    abortRef.current = false

    try {
      const token = await getAccessToken()
      const result = await callManualSync(token, { mode: "incremental" })

      setState((prev) => ({
        ...prev,
        isRunning: false,
        summary: result.summary,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: message,
      }))
    }
  }, [])

  const runFullSync = useCallback(async () => {
    setState({ ...INITIAL_STATE, isRunning: true, mode: "full" })
    abortRef.current = false

    let offset = 0
    let totalContacts: number | null = null
    let cumulativeSummary: SyncSummary | null = null
    let batchNumber = 0

    try {
      const token = await getAccessToken()

      let hasMore = true
      while (hasMore) {
        if (abortRef.current) {
          setState((prev) => ({ ...prev, isRunning: false, aborted: true }))
          return
        }

        batchNumber++

        setState((prev) => ({
          ...prev,
          batchProgress: {
            currentBatch: batchNumber,
            totalBatches: totalContacts
              ? Math.ceil(totalContacts / FULL_SYNC_BATCH_SIZE)
              : null,
            processedContacts: offset,
            totalContacts,
          },
        }))

        const result = await callManualSync(token, {
          mode: "full",
          offset,
          limit: FULL_SYNC_BATCH_SIZE,
        })

        const summary = result.summary

        if (!totalContacts) {
          totalContacts = summary.total
        }

        if (!cumulativeSummary) {
          cumulativeSummary = { ...summary, details: [] }
        } else {
          cumulativeSummary.synced += summary.synced
          cumulativeSummary.failed += summary.failed
          cumulativeSummary.skipped += summary.skipped
          cumulativeSummary.newContacts += summary.newContacts
          cumulativeSummary.updatedContacts += summary.updatedContacts
          cumulativeSummary.completedAt = summary.completedAt
          cumulativeSummary.durationMs += summary.durationMs
        }

        hasMore = summary.hasMore
        offset = summary.nextOffset

        setState((prev) => ({
          ...prev,
          batchProgress: {
            currentBatch: batchNumber,
            totalBatches: Math.ceil((totalContacts ?? 0) / FULL_SYNC_BATCH_SIZE),
            processedContacts: offset,
            totalContacts,
          },
        }))
      }

      if (cumulativeSummary) {
        cumulativeSummary.total = totalContacts ?? 0
        cumulativeSummary.hasMore = false
        cumulativeSummary.batchOffset = 0
        cumulativeSummary.batchLimit = totalContacts ?? 0
      }

      setState((prev) => ({
        ...prev,
        isRunning: false,
        summary: cumulativeSummary,
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setState((prev) => ({
        ...prev,
        isRunning: false,
        error: message,
        summary: cumulativeSummary,
      }))
    }
  }, [])

  const handleAbort = useCallback(() => {
    abortRef.current = true
  }, [])

  const progressPercentage =
    state.batchProgress?.totalContacts
      ? Math.round(
          (state.batchProgress.processedContacts /
            state.batchProgress.totalContacts) *
            100
        )
      : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-2xl font-bold text-gray-900">
            GHL Contact Sync
          </CardTitle>
          <CardDescription className="text-base mt-1">
            Synchronize parent contacts from enrollment data to GoHighLevel
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 border rounded-lg bg-white space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-lg">Incremental Sync</h3>
              </div>
              <p className="text-sm text-gray-600">
                Syncs only enrollments created in the last 7 hours. Fast and lightweight — same logic used by the automated cron job.
              </p>
              <Button
                onClick={runIncrementalSync}
                disabled={state.isRunning}
                className="w-full gap-2"
                variant="default"
              >
                {state.isRunning && state.mode === "incremental" ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {state.isRunning && state.mode === "incremental"
                  ? "Syncing..."
                  : "Run Incremental Sync"}
              </Button>
            </div>

            <div className="p-6 border rounded-lg bg-white space-y-3">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Full Sync</h3>
              </div>
              <p className="text-sm text-gray-600">
                Syncs all active contacts in batches of {FULL_SYNC_BATCH_SIZE}. Use this for initial setup or to ensure all records are up to date.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={runFullSync}
                  disabled={state.isRunning}
                  className="flex-1 gap-2"
                  variant="outline"
                >
                  {state.isRunning && state.mode === "full" ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  {state.isRunning && state.mode === "full"
                    ? "Syncing..."
                    : "Run Full Sync"}
                </Button>
                {state.isRunning && state.mode === "full" && (
                  <Button
                    onClick={handleAbort}
                    variant="destructive"
                    size="sm"
                  >
                    Stop
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {state.isRunning && state.mode === "full" && state.batchProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              Full Sync in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Batch {state.batchProgress.currentBatch}
                {state.batchProgress.totalBatches
                  ? ` of ${state.batchProgress.totalBatches}`
                  : ""}
              </span>
              <span>
                {state.batchProgress.processedContacts}
                {state.batchProgress.totalContacts
                  ? ` / ${state.batchProgress.totalContacts}`
                  : ""}{" "}
                contacts
              </span>
              <span>{progressPercentage}%</span>
            </div>
          </CardContent>
        </Card>
      )}

      {state.isRunning && state.mode === "incremental" && (
        <Card>
          <CardContent className="p-6 flex items-center justify-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-gray-700 font-medium">
              Running incremental sync...
            </span>
          </CardContent>
        </Card>
      )}

      {state.error && (
        <Card className="border-red-200">
          <CardContent className="p-6 flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-700">Sync Error</div>
              <div className="text-sm text-red-600 mt-1">{state.error}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {state.aborted && !state.isRunning && (
        <Card className="border-amber-200">
          <CardContent className="p-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-700">Sync Aborted</div>
              <div className="text-sm text-amber-600 mt-1">
                The full sync was stopped. Contacts processed before stopping are already synced.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {state.summary && !state.isRunning && (
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Sync Complete
              </CardTitle>
              <Badge variant="outline" className="uppercase">
                {state.summary.mode}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                icon={Users}
                label="Total"
                value={state.summary.total}
              />
              <StatCard
                icon={UserPlus}
                label="New"
                value={state.summary.newContacts}
                variant="success"
              />
              <StatCard
                icon={UserCheck}
                label="Updated"
                value={state.summary.updatedContacts}
                variant="default"
              />
              <StatCard
                icon={XCircle}
                label="Failed"
                value={state.summary.failed}
                variant={state.summary.failed > 0 ? "error" : "default"}
              />
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 pt-2 border-t">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Duration: {formatDuration(state.summary.durationMs)}
              </div>
              {state.summary.skipped > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Skipped: {state.summary.skipped}
                </div>
              )}
              <div>
                Synced: {state.summary.synced} / {state.summary.total}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
