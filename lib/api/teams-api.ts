import type { Team, CreateTeamData, UpdateTeamData } from "@/lib/db/team-service"

class TeamsApi {
  async getAll(): Promise<Team[]> {
    try {
      console.log("TeamsApi: Fetching all teams")
      const response = await fetch("/api/teams")

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.details || `Failed to fetch teams: ${response.status}`)
      }

      const teams = await response.json()
      console.log("TeamsApi: Teams fetched successfully:", teams.length)
      return teams
    } catch (error) {
      console.error("TeamsApi: Error fetching teams:", error)
      throw error
    }
  }

  async getById(id: string): Promise<Team> {
    try {
      console.log("TeamsApi: Fetching team by ID:", id)
      const response = await fetch(`/api/teams/${id}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.details || `Failed to fetch team: ${response.status}`)
      }

      const team = await response.json()
      console.log("TeamsApi: Team fetched successfully:", team)
      return team
    } catch (error) {
      console.error("TeamsApi: Error fetching team:", error)
      throw error
    }
  }

  async create(teamData: CreateTeamData): Promise<Team> {
    try {
      console.log("TeamsApi: Creating team:", teamData)
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.details || `Failed to create team: ${response.status}`)
      }

      const team = await response.json()
      console.log("TeamsApi: Team created successfully:", team)
      return team
    } catch (error) {
      console.error("TeamsApi: Error creating team:", error)
      throw error
    }
  }

  async update(id: string, teamData: UpdateTeamData): Promise<Team> {
    try {
      console.log("TeamsApi: Updating team:", id, teamData)
      const response = await fetch(`/api/teams/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.details || `Failed to update team: ${response.status}`)
      }

      const team = await response.json()
      console.log("TeamsApi: Team updated successfully:", team)
      return team
    } catch (error) {
      console.error("TeamsApi: Error updating team:", error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log("TeamsApi: Deleting team:", id)
      const response = await fetch(`/api/teams/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.details || `Failed to delete team: ${response.status}`)
      }

      console.log("TeamsApi: Team deleted successfully")
    } catch (error) {
      console.error("TeamsApi: Error deleting team:", error)
      throw error
    }
  }
}

export const teamsApi = new TeamsApi()
