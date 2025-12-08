"use client"

import { useState, useMemo } from "react"
import { useTeams, useDeleteTeam, useDuplicateTeam, type TeamFilters } from "@/hooks/use-teams"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Search, Settings, Copy } from "lucide-react"
import { TeamDialog } from "./team-dialog"
import { useSchoolsWithRefresh } from "@/hooks/use-schools-with-refresh"
import { useDebouncedCallback } from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"

export function TeamsTable() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<TeamFilters>({})
  const [searchInput, setSearchInput] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<string | null>(null)
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null)

  const { data, isLoading } = useTeams(filters, page)
  const { schools } = useSchoolsWithRefresh()
  const deleteTeam = useDeleteTeam()
  const duplicateTeam = useDuplicateTeam()

  // Debounced search
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value || undefined }))
    setPage(1)
  }, 500)

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    debouncedSearch(value)
  }

  // Get unique sports for filter
  const sports = useMemo(() => {
    const sportsSet = new Set<string>()
    data?.teams.forEach((team) => {
      if (team.sport) sportsSet.add(team.sport)
    })
    return Array.from(sportsSet).sort()
  }, [data])

  const handleDelete = async () => {
    if (!deletingTeam) return
    await deleteTeam.mutateAsync(deletingTeam)
    setDeletingTeam(null)
  }

  const handleDuplicate = async (teamId: string, teamName: string) => {
    try {
      const newTeam = await duplicateTeam.mutateAsync(teamId)
      // Abrir el diálogo de edición con el nuevo team
      setEditingTeam(newTeam.teamid)
      setDialogOpen(true)
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={filters.schoolId?.toString() || "all"}
          onValueChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              schoolId: value === "all" ? undefined : parseInt(value),
            }))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Schools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Schools</SelectItem>
            {schools?.map((school) => (
              <SelectItem key={school.schoolid} value={school.schoolid.toString()}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sport || "all"}
          onValueChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              sport: value === "all" ? undefined : value,
            }))
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="All Sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {sports.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {sport}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Team
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading teams...
                </TableCell>
              </TableRow>
            ) : data?.teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No teams found
                </TableCell>
              </TableRow>
            ) : (
              data?.teams.map((team) => (
                <TableRow key={team.teamid}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>
                    {team.sport ? (
                      <Badge variant="outline">{team.sport}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{team.school?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {team.school?.location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        team.status === "open" ? "default" : 
                        team.status === "ongoing" ? "outline" : 
                        team.status === "closed" ? "secondary" : 
                        "secondary"
                      }
                      className={
                        team.status === "ongoing" ? "bg-orange-50 border-orange-300 text-orange-700" :
                        team.status === "closed" ? "bg-gray-100 text-gray-700" :
                        team.status === "archived" ? "bg-gray-200 text-gray-500" :
                        ""
                      }
                    >
                      {team.status === "open" && "Open"}
                      {team.status === "ongoing" && "Ongoing"}
                      {team.status === "closed" && "Closed"}
                      {team.status === "archived" && "Archived"}
                      {!team.status && "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {team._count?.enrollments || 0} / {team.participants}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {team.price ? `$${team.price}` : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => router.push(`/registrations/${team.teamid}`)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Sessions
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingTeam(team.teamid)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(team.teamid, team.name)}
                          disabled={duplicateTeam.isPending}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate Team
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingTeam(team.teamid)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} ({data.total} total teams)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <TeamDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingTeam(null)
        }}
        teamId={editingTeam}
      />

      <AlertDialog open={!!deletingTeam} onOpenChange={() => setDeletingTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

