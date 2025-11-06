"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useCreateSession, useUpdateSession, type Session } from "@/hooks/use-sessions"
import { useStaff } from "@/contexts/staff-context"
import { Loader2 } from "lucide-react"

const WEEKDAYS = [
  { id: "Monday", label: "Monday" },
  { id: "Tuesday", label: "Tuesday" },
  { id: "Wednesday", label: "Wednesday" },
  { id: "Thursday", label: "Thursday" },
  { id: "Friday", label: "Friday" },
  { id: "Saturday", label: "Saturday" },
  { id: "Sunday", label: "Sunday" },
]

const sessionSchema = z
  .object({
    daysofweek: z.array(z.string()).min(1, "Select at least one day"),
    starttime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
    endtime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)"),
    startdate: z.string().optional(),
    enddate: z.string().optional(),
    coachid: z.string().default("none"),
  })
  .refine(
    (data) => {
      if (data.starttime && data.endtime) {
        return data.starttime < data.endtime
      }
      return true
    },
    {
      message: "End time must be after start time",
      path: ["endtime"],
    }
  )

type SessionFormValues = z.infer<typeof sessionSchema>

interface SessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId: string | null
  session?: Session | null
}

export function SessionDialog({
  open,
  onOpenChange,
  teamId,
  session,
}: SessionDialogProps) {
  const { staff, loading: staffLoading, error: staffError } = useStaff()
  const createSession = useCreateSession()
  const updateSession = useUpdateSession()

  const isEdit = !!session

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      daysofweek: [],
      starttime: "",
      endtime: "",
      startdate: "",
      enddate: "",
      coachid: "none",
    },
  })

  // Reset form when dialog opens/closes or session changes
  useEffect(() => {
    if (open && session && isEdit) {
      const days = session.daysofweek.split(",").map((d) => d.trim())
      form.reset({
        daysofweek: days,
        starttime: session.starttime,
        endtime: session.endtime,
        startdate: session.startdate || "",
        enddate: session.enddate || "",
        coachid: session.coachid || "none",
      })
    } else if (open && !isEdit) {
      form.reset({
        daysofweek: [],
        starttime: "15:00",
        endtime: "16:30",
        startdate: "",
        enddate: "",
        coachid: "none",
      })
    }
  }, [open, session, isEdit, form])

  const onSubmit = async (values: SessionFormValues) => {
    if (!teamId) return

    try {
      const payload = {
        teamid: teamId,
        daysofweek: values.daysofweek.join(", "),
        starttime: values.starttime,
        endtime: values.endtime,
        startdate: values.startdate || undefined,
        enddate: values.enddate || undefined,
        coachid: values.coachid && values.coachid !== "none" ? values.coachid : undefined,
        repeat: "weekly",
      }

      if (isEdit && session) {
        await updateSession.mutateAsync({
          sessionid: session.sessionid,
          ...payload,
        })
      } else {
        await createSession.mutateAsync(payload)
      }

      onOpenChange(false)
      form.reset()
    } catch (error) {
      // Error handled by mutation hooks
    }
  }

  const isLoading = createSession.isPending || updateSession.isPending

  // Get coaches (staff with coach role, or all staff if role doesn't exist)
  const coaches = staff?.filter((s) => {
    // If role field exists, filter by "coach"
    // If role field doesn't exist, include all staff
    return !s.role || s.role === "coach"
  }) || []

  // Helper function to get full name
  const getStaffFullName = (staffMember: any) => {
    if (staffMember.firstname && staffMember.lastname) {
      return `${staffMember.firstname} ${staffMember.lastname}`
    }
    return staffMember.name || "Unknown"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Session" : "Create New Session"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update session schedule and coach assignment"
              : "Configure session days, times, and coach"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Days of Week */}
            <FormField
              control={form.control}
              name="daysofweek"
              render={() => (
                <FormItem>
                  <FormLabel>Days of Week *</FormLabel>
                  <FormDescription>
                    Select all days when this session occurs
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {WEEKDAYS.map((day) => (
                      <FormField
                        key={day.id}
                        control={form.control}
                        name="daysofweek"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={day.id}
                              className="flex items-center space-x-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          day.id,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== day.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {day.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="starttime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endtime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      First day of sessions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enddate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Last day of sessions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Coach Selection */}
            <FormField
              control={form.control}
              name="coachid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coach</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a coach (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No coach assigned</SelectItem>
                      {staffLoading ? (
                        <div className="py-2 px-2 text-sm text-muted-foreground">
                          Loading coaches...
                        </div>
                      ) : staffError ? (
                        <div className="py-2 px-2 text-sm text-destructive">
                          Error loading coaches: {staffError}
                        </div>
                      ) : coaches.length === 0 ? (
                        <div className="py-2 px-2 text-sm text-muted-foreground">
                          No coaches available (Total staff: {staff?.length || 0})
                        </div>
                      ) : (
                        coaches.map((coach) => (
                          <SelectItem key={coach.id} value={coach.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {getStaffFullName(coach)}
                              </span>
                              {coach.email && (
                                <span className="text-xs text-muted-foreground">
                                  {coach.email}
                                </span>
                              )}
                              {coach.role && (
                                <span className="text-xs text-muted-foreground">
                                  Role: {coach.role}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Assign a coach to this session
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Update Session" : "Create Session"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}


