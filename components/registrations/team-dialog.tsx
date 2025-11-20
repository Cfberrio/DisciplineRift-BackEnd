"use client"

import { useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useSchoolsWithRefresh } from "@/hooks/use-schools-with-refresh"
import { useCreateTeam, useUpdateTeam, useTeam } from "@/hooks/use-teams"
import { Loader2 } from "lucide-react"

const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  sport: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  participants: z.coerce.number().min(1, "Must have at least 1 participant"),
  isactive: z.boolean().default(true),
  isongoing: z.boolean().default(false),
  schoolid: z.coerce.number().min(1, "School is required"),
})

type TeamFormValues = z.infer<typeof teamSchema>

interface TeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamId?: string | null
}

export function TeamDialog({ open, onOpenChange, teamId }: TeamDialogProps) {
  const { schools } = useSchoolsWithRefresh()
  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()
  const isEdit = !!teamId
  
  // Fetch específico del team al editar (más eficiente)
  const { data: team, isLoading: teamLoading } = useTeam(teamId)

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      sport: "",
      description: "",
      price: 0,
      participants: 20,
      isactive: true,
      isongoing: false,
      schoolid: 0,
    },
  })

  // Reset form when dialog opens/closes or team changes
  useEffect(() => {
    if (open && team && isEdit) {
      form.reset({
        name: team.name,
        sport: team.sport || "",
        description: team.description || "",
        price: team.price || 0,
        participants: team.participants,
        isactive: team.isactive,
        isongoing: team.isongoing,
        schoolid: team.schoolid,
      })
    } else if (open && !isEdit) {
      form.reset({
        name: "",
        sport: "",
        description: "",
        price: 0,
        participants: 20,
        isactive: true,
        isongoing: false,
        schoolid: schools?.[0]?.schoolid || 0,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, teamId, team]) // Incluir team para actualizar cuando se cargue

  const onSubmit = async (values: TeamFormValues) => {
    try {
      if (isEdit && teamId) {
        await updateTeam.mutateAsync({ ...values, teamid: teamId })
      } else {
        await createTeam.mutateAsync(values)
      }
      // Cerrar primero para detener el query activo
      onOpenChange(false)
      // Resetear después con un pequeño delay para evitar warnings
      setTimeout(() => form.reset(), 0)
    } catch (error) {
      // Error handled by mutation hooks
    }
  }

  const isLoading = createTeam.isPending || updateTeam.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Team" : "Create New Team"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update team information and settings"
              : "Add a new team to the system"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Volleyball U12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sport</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Basketball" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="schoolid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>School *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a school" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {schools?.map((school) => (
                        <SelectItem
                          key={school.schoolid}
                          value={school.schoolid.toString()}
                        >
                          {school.name} - {school.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Team description..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum number of students
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Registration fee (USD)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="isactive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Accept new registrations
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isongoing"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div>
                      <FormLabel>Ongoing</FormLabel>
                      <FormDescription>
                        Sessions are running
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

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
                {isEdit ? "Update Team" : "Create Team"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}


